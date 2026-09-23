using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace Skarmro.JuniorLauncher;

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

public partial class MainWindow : Window
{
    private bool _allowClose;

    private static readonly string ProjectionPath =
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "SkarmroPublic",
            "launcher-policy.json");

    public MainWindow()
    {
        InitializeComponent();
        LoadLauncherApps();
    }

    private void LoadLauncherApps()
    {
        var apps = ReadProjection()
            .Where(app => !string.IsNullOrWhiteSpace(app.ProcessName))
            .GroupBy(app => app.ProcessName, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToArray();

        AppTilesPanel.Children.Clear();

        foreach (var app in apps)
            AppTilesPanel.Children.Add(CreateTile(app));

        EmptyStatePanel.Visibility = apps.Length == 0
            ? Visibility.Visible
            : Visibility.Collapsed;

        ProtectionStatusText.Text = apps.Length == 0
            ? "Skydd aktivt · inga appar"
            : $"Skydd aktivt · {apps.Length} appar";
    }

    private static LauncherAppProjection[] ReadProjection()
    {
        try
        {
            if (!File.Exists(ProjectionPath))
                return SafeFallbackApps();

            var json = File.ReadAllText(ProjectionPath);
            var projection = JsonSerializer.Deserialize<LauncherProjection>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (projection is null || projection.Version != 1)
                return SafeFallbackApps();

            return projection.Apps ?? Array.Empty<LauncherAppProjection>();
        }
        catch
        {
            return SafeFallbackApps();
        }
    }

    private static LauncherAppProjection[] SafeFallbackApps() =>
    [
        new() { ProcessName = "calc.exe", DisplayName = "Miniräknare", Icon = "＋" },
        new() { ProcessName = "mspaint.exe", DisplayName = "Rita", Icon = "✎" },
        new() { ProcessName = "chrome.exe", DisplayName = "Internet", Icon = "◎", Subtitle = "SKÄRMRO Browser Guard" }
    ];

    private Button CreateTile(LauncherAppProjection app)
    {
        var stack = new StackPanel
        {
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center
        };

        stack.Children.Add(new TextBlock
        {
            Text = string.IsNullOrWhiteSpace(app.Icon) ? "▣" : app.Icon,
            FontSize = 52,
            HorizontalAlignment = HorizontalAlignment.Center
        });

        stack.Children.Add(new TextBlock
        {
            Text = string.IsNullOrWhiteSpace(app.DisplayName) ? app.ProcessName : app.DisplayName,
            FontSize = 20,
            FontWeight = FontWeights.Bold,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 12, 0, 0)
        });

        if (!string.IsNullOrWhiteSpace(app.Subtitle))
        {
            stack.Children.Add(new TextBlock
            {
                Text = app.Subtitle,
                FontSize = 11,
                Foreground = new SolidColorBrush(Color.FromRgb(0xB5, 0xC6, 0xD6)),
                HorizontalAlignment = HorizontalAlignment.Center,
                Margin = new Thickness(0, 4, 0, 0)
            });
        }

        var button = new Button
        {
            Tag = app.ProcessName,
            Content = stack,
            Margin = new Thickness(0, 0, 18, 18),
            Background = new SolidColorBrush(Color.FromRgb(0x18, 0x32, 0x47)),
            BorderThickness = new Thickness(0)
        };

        button.Click += Launch_Click;
        return button;
    }

    private void Launch_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not FrameworkElement element || element.Tag is not string command)
            return;

        try
        {
            Process.Start(new ProcessStartInfo(command) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Appen kunde inte startas.\n\n{ex.Message}",
                "SKÄRMRO",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }
    }

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.F12 &&
            Keyboard.Modifiers.HasFlag(ModifierKeys.Control) &&
            Keyboard.Modifiers.HasFlag(ModifierKeys.Shift))
        {
            MessageBox.Show(
                "Föräldraläge kräver Native Guard-auktorisering i produktversionen.\n\n" +
                "I Gate 0: använd Ctrl+Alt+Delete och välj Byt användare.",
                "SKÄRMRO Förälder",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            e.Handled = true;
        }
    }

    private void Window_Closing(object? sender, CancelEventArgs e)
    {
        if (!_allowClose)
            e.Cancel = true;
    }
}
