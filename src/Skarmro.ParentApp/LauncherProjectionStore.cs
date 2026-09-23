using System.IO;
using System.Text.Json;

namespace Skarmro.ParentApp;

public sealed class LauncherAppProjection
{
    public string ProcessName { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Icon { get; set; } = "□";
    public string? Subtitle { get; set; }
}

public sealed class LauncherProjection
{
    public int Version { get; set; } = 1;
    public string UpdatedAtUtc { get; set; } = "";
    public LauncherAppProjection[] Apps { get; set; } = Array.Empty<LauncherAppProjection>();
}

public static class LauncherProjectionStore
{
    private static readonly string Root =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "SkarmroPublic");

    public static readonly string ProjectionPath =
        Path.Combine(Root, "launcher-policy.json");

    public static void WriteFrom(NativeAppPolicy policy)
    {
        Directory.CreateDirectory(Root);

        var blocked = new HashSet<string>(
            policy.BlockedProcessNames,
            StringComparer.OrdinalIgnoreCase);

        var apps = policy.AllowedProcessNames
            .Where(name => !blocked.Contains(name))
            .Select(CreateProjection)
            .OrderBy(app => app.DisplayName, StringComparer.CurrentCultureIgnoreCase)
            .ToArray();

        var projection = new LauncherProjection
        {
            UpdatedAtUtc = DateTimeOffset.UtcNow.ToString("O"),
            Apps = apps
        };

        var json = JsonSerializer.Serialize(
            projection,
            new JsonSerializerOptions { WriteIndented = true });

        var temp = ProjectionPath + ".tmp";
        File.WriteAllText(temp, json);
        File.Move(temp, ProjectionPath, true);
    }

    private static LauncherAppProjection CreateProjection(string processName)
    {
        var normalized = NativePolicyStore.NormalizeProcessName(processName);

        return normalized.ToLowerInvariant() switch
        {
            "calc.exe" => new() { ProcessName = normalized, DisplayName = "Miniräknare", Icon = "＋" },
            "mspaint.exe" => new() { ProcessName = normalized, DisplayName = "Rita", Icon = "✎" },
            "chrome.exe" => new() { ProcessName = normalized, DisplayName = "Internet", Icon = "◎", Subtitle = "SKÄRMRO Browser Guard" },
            _ => new()
            {
                ProcessName = normalized,
                DisplayName = Path.GetFileNameWithoutExtension(normalized),
                Icon = "▣"
            }
        };
    }
}
