using System.Text.Json;

namespace Skarmro.GuardService;

public sealed class GuardWorker : BackgroundService
{
    private readonly ILogger<GuardWorker> _logger;

    private static readonly string ProgramDataRoot =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Skarmro");

    private static readonly string StatusPath =
        Path.Combine(ProgramDataRoot, "guard-status.json");

    public GuardWorker(ILogger<GuardWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Directory.CreateDirectory(ProgramDataRoot);

        _logger.LogInformation("SKARMRO Guard started at {Time}", DateTimeOffset.Now);

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
                version = "gate0-week1"
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
}
