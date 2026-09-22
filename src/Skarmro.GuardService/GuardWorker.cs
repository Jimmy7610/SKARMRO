using System.Diagnostics;
using System.Management;
using System.Text.Json;

namespace Skarmro.GuardService;

public sealed class GuardWorker : BackgroundService
{
    private readonly ILogger<GuardWorker> _logger;
    private ManagementEventWatcher? _processWatcher;

    private static readonly string ProgramDataRoot =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Skarmro");

    private static readonly string StatusPath =
        Path.Combine(ProgramDataRoot, "guard-status.json");

    private static readonly string ProcessGuardPolicyPath =
        Path.Combine(ProgramDataRoot, "process-guard-policy.json");

    private static readonly string ProcessGuardEventsPath =
        Path.Combine(ProgramDataRoot, "process-guard-events.jsonl");

    public GuardWorker(ILogger<GuardWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Directory.CreateDirectory(ProgramDataRoot);

        _logger.LogInformation("SKARMRO Guard started at {Time}", DateTimeOffset.Now);

        StartProcessWatcher();

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var status = new
                {
                    service = "SkarmroGuardService",
                    state = "running",
                    machine = Environment.MachineName,
                    identity = System.Security.Principal.WindowsIdentity.GetCurrent().Name,
                    pid = Environment.ProcessId,
                    timestampUtc = DateTimeOffset.UtcNow,
                    version = "gate0-week2-process-guard",
                    processGuard = new
                    {
                        watcherActive = _processWatcher is not null,
                        policyPath = ProcessGuardPolicyPath,
                        policyPresent = File.Exists(ProcessGuardPolicyPath)
                    }
                };

                var temp = StatusPath + ".tmp";
                var json = JsonSerializer.Serialize(status, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                await File.WriteAllTextAsync(temp, json, stoppingToken);
                File.Move(temp, StatusPath, true);

                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
        finally
        {
            StopProcessWatcher();
        }
    }

    private void StartProcessWatcher()
    {
        try
        {
            var query = new WqlEventQuery("SELECT * FROM Win32_ProcessStartTrace");
            _processWatcher = new ManagementEventWatcher(query);
            _processWatcher.EventArrived += OnProcessStarted;
            _processWatcher.Start();

            _logger.LogInformation("SKARMRO Process Guard watcher started.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start SKARMRO Process Guard watcher.");
            _processWatcher?.Dispose();
            _processWatcher = null;
        }
    }

    private void StopProcessWatcher()
    {
        if (_processWatcher is null)
        {
            return;
        }

        try
        {
            _processWatcher.Stop();
        }
        catch
        {
            // Ignore shutdown races.
        }

        _processWatcher.EventArrived -= OnProcessStarted;
        _processWatcher.Dispose();
        _processWatcher = null;
    }

    private void OnProcessStarted(object sender, EventArrivedEventArgs e)
    {
        try
        {
            var processIdValue = e.NewEvent.Properties["ProcessID"]?.Value;
            var processName = e.NewEvent.Properties["ProcessName"]?.Value?.ToString();

            if (processIdValue is null || string.IsNullOrWhiteSpace(processName))
            {
                return;
            }

            var processId = Convert.ToInt32(processIdValue);
            var policy = LoadProcessGuardPolicy();

            if (policy is null || !policy.Enabled || string.IsNullOrWhiteSpace(policy.ChildSid))
            {
                return;
            }

            if (!policy.BlockedProcessNames.Contains(processName, StringComparer.OrdinalIgnoreCase))
            {
                return;
            }

            var ownerSid = TryGetProcessOwnerSid(processId);
            if (!string.Equals(ownerSid, policy.ChildSid, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var startedAt = DateTimeOffset.UtcNow;
            var killed = false;
            string? error = null;

            try
            {
                using var process = Process.GetProcessById(processId);
                process.Kill(entireProcessTree: true);
                killed = true;
            }
            catch (Exception ex)
            {
                error = ex.Message;
            }

            WriteProcessGuardEvent(new
            {
                timestampUtc = startedAt,
                processId,
                processName,
                ownerSid,
                action = killed ? "terminated" : "termination_failed",
                error
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Process Guard event handler failed.");
        }
    }

    private static ProcessGuardPolicy? LoadProcessGuardPolicy()
    {
        try
        {
            if (!File.Exists(ProcessGuardPolicyPath))
            {
                return null;
            }

            var json = File.ReadAllText(ProcessGuardPolicyPath);
            return JsonSerializer.Deserialize<ProcessGuardPolicy>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            return null;
        }
    }

    private static string? TryGetProcessOwnerSid(int processId)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(
                $"SELECT * FROM Win32_Process WHERE ProcessId = {processId}");

            foreach (ManagementObject process in searcher.Get())
            {
                using (process)
                {
                    var result = process.InvokeMethod("GetOwnerSid", null, null);
                    if (result is null)
                    {
                        return null;
                    }

                    var returnValue = Convert.ToUInt32(result["ReturnValue"]);
                    if (returnValue != 0)
                    {
                        return null;
                    }

                    return result["Sid"]?.ToString();
                }
            }
        }
        catch
        {
            // The process may already have exited before owner lookup.
        }

        return null;
    }

    private static void WriteProcessGuardEvent(object evt)
    {
        try
        {
            var line = JsonSerializer.Serialize(evt);
            File.AppendAllText(ProcessGuardEventsPath, line + Environment.NewLine);
        }
        catch
        {
            // Event logging must never crash enforcement.
        }
    }

    private sealed class ProcessGuardPolicy
    {
        public bool Enabled { get; set; }
        public string ChildSid { get; set; } = "";
        public string[] BlockedProcessNames { get; set; } = Array.Empty<string>();
    }
}
