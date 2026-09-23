using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;

namespace Skarmro.ParentApp;

public partial class MainWindow : Window
{
    private NativeAppPolicy _nativePolicy = new();

    public MainWindow()
    {
        InitializeComponent();
        ActiveRoutineText.Text = GetRoutineLabel();
        LoadNativePolicy();
        RefreshNativeHealth();
    }

    private static string GetRoutineLabel()
    {
        var hour = DateTime.Now.Hour;
        return hour >= 20 || hour < 7 ? "Läggdags" : "Ingen";
    }

    private void LoadNativePolicy()
    {
        try
        {
            _nativePolicy = NativePolicyStore.ReadOrCreate("SkarmroChild");
            RefreshAppLists();
            AppsPolicyStatusText.Text =
                $"Policy laddad · {_nativePolicy.BlockedProcessNames.Length} blockerade · {_nativePolicy.AllowedProcessNames.Length} tillåtna";
        }
        catch (Exception ex)
        {
            _nativePolicy = NativePolicyStore.CreateBaseline("SkarmroChild");
            RefreshAppLists();
            AppsPolicyStatusText.Text = "Kunde inte läsa befintlig policy: " + ex.Message;
        }
    }

    private void RefreshAppLists()
    {
        AllowedAppsList.ItemsSource = null;
        AllowedAppsList.ItemsSource = _nativePolicy.AllowedProcessNames
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        BlockedAppsList.ItemsSource = null;
        BlockedAppsList.ItemsSource = _nativePolicy.BlockedProcessNames
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private void RefreshNativeHealth()
    {
        var health = NativeHealthReader.Read();

        if (!health.StatusPresent)
        {
            NativeGuardHealthText.Text = "!  Native Guard heartbeat saknas";
            NativePolicyHealthText.Text = "!  Native policy-status saknas";
            return;
        }

        NativeGuardHealthText.Text = health.HeartbeatFresh
            ? $"✓  Native Guard {health.State} · {health.Version}"
            : "!  Native Guard heartbeat är gammal";

        if (health.Version == "gate0-week2-process-guard")
        {
            NativePolicyHealthText.Text = health.PolicyPresent
                ? "✓  Native policy finns · legacy runtime verifierad på WILMA"
                : "!  Native policy saknas";
            return;
        }

        NativePolicyHealthText.Text = health.PolicyValid
            ? $"✓  Native policy giltig · enforcement {(health.EnforcementEnabled ? "på" : "av")}"
            : $"!  Native policy: {health.PolicyReason}";
    }

    private void ShowOverview_Click(object sender, RoutedEventArgs e)
    {
        OverviewPanel.Visibility = Visibility.Visible;
        AppsPanel.Visibility = Visibility.Collapsed;
        PageTitleText.Text = "Översikt";
        OverviewNavButton.Background = new System.Windows.Media.SolidColorBrush(
            System.Windows.Media.Color.FromRgb(0x18, 0x24, 0x32));
        AppsNavButton.Background = System.Windows.Media.Brushes.Transparent;
    }

    private void ShowApps_Click(object sender, RoutedEventArgs e)
    {
        OverviewPanel.Visibility = Visibility.Collapsed;
        AppsPanel.Visibility = Visibility.Visible;
        PageTitleText.Text = "Appar";
        AppsNavButton.Background = new System.Windows.Media.SolidColorBrush(
            System.Windows.Media.Color.FromRgb(0x18, 0x24, 0x32));
        OverviewNavButton.Background = System.Windows.Media.Brushes.Transparent;
        LoadNativePolicy();
    }

    private void AddAllowedApp_Click(object sender, RoutedEventArgs e)
    {
        var name = NativePolicyStore.NormalizeProcessName(AllowedAppInput.Text);
        if (string.IsNullOrWhiteSpace(name))
            return;

        var allowed = _nativePolicy.AllowedProcessNames.ToList();
        if (!allowed.Contains(name, StringComparer.OrdinalIgnoreCase))
            allowed.Add(name);

        _nativePolicy.AllowedProcessNames = allowed.ToArray();

        var blocked = _nativePolicy.BlockedProcessNames
            .Where(item => !string.Equals(item, name, StringComparison.OrdinalIgnoreCase))
            .ToArray();
        _nativePolicy.BlockedProcessNames = blocked;

        AllowedAppInput.Clear();
        RefreshAppLists();
        AppsPolicyStatusText.Text = "Osparade ändringar";
    }

    private void AddBlockedApp_Click(object sender, RoutedEventArgs e)
    {
        var name = NativePolicyStore.NormalizeProcessName(BlockedAppInput.Text);
        if (string.IsNullOrWhiteSpace(name))
            return;

        var blocked = _nativePolicy.BlockedProcessNames.ToList();
        if (!blocked.Contains(name, StringComparer.OrdinalIgnoreCase))
            blocked.Add(name);

        _nativePolicy.BlockedProcessNames = blocked.ToArray();

        var allowed = _nativePolicy.AllowedProcessNames
            .Where(item => !string.Equals(item, name, StringComparison.OrdinalIgnoreCase))
            .ToArray();
        _nativePolicy.AllowedProcessNames = allowed;

        BlockedAppInput.Clear();
        RefreshAppLists();
        AppsPolicyStatusText.Text = "Osparade ändringar";
    }

    private void RemoveAllowedApp_Click(object sender, RoutedEventArgs e)
    {
        if (AllowedAppsList.SelectedItem is not string selected)
            return;

        _nativePolicy.AllowedProcessNames = _nativePolicy.AllowedProcessNames
            .Where(item => !string.Equals(item, selected, StringComparison.OrdinalIgnoreCase))
            .ToArray();

        RefreshAppLists();
        AppsPolicyStatusText.Text = "Osparade ändringar";
    }

    private void RemoveBlockedApp_Click(object sender, RoutedEventArgs e)
    {
        if (BlockedAppsList.SelectedItem is not string selected)
            return;

        _nativePolicy.BlockedProcessNames = _nativePolicy.BlockedProcessNames
            .Where(item => !string.Equals(item, selected, StringComparison.OrdinalIgnoreCase))
            .ToArray();

        RefreshAppLists();
        AppsPolicyStatusText.Text = "Osparade ändringar";
    }

    private async void SaveNativePolicy_Click(object sender, RoutedEventArgs e)
    {
        SaveNativePolicyButton.IsEnabled = false;

        try
        {
            _nativePolicy.Enabled = true;
            AppsPolicyStatusText.Text = "Sparar via Guard Service...";

            var response = await GuardPolicyClient.SaveAsync(_nativePolicy);

            if (!response.Success)
            {
                AppsPolicyStatusText.Text = "Kunde inte spara policy";
                MessageBox.Show(
                    "Kunde inte spara appreglerna.\n\n" + response.Message,
                    "SKÄRMRO",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
                return;
            }

            LoadNativePolicy();
            AppsPolicyStatusText.Text =
                $"Sparad via Guard Service · {_nativePolicy.BlockedProcessNames.Length} blockerade · {_nativePolicy.AllowedProcessNames.Length} tillåtna";

            RefreshNativeHealth();

            MessageBox.Show(
                "Appreglerna sparades säkert via SKÄRMRO Guard Service.\n\n" +
                "Blockerade processer börjar gälla direkt vid nästa processstart.\n" +
                "Junior Launcher har uppdaterats med samma tillåt-lista.\n" +
                "Parent App har inte fått direkt skrivåtkomst till den skyddade policyn.\n" +
                "Smart App Control har inte ändrats.",
                "SKÄRMRO",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            AppsPolicyStatusText.Text = "Kunde inte spara policy";
            MessageBox.Show(
                "Kunde inte spara appreglerna.\n\n" + ex.Message,
                "SKÄRMRO",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
        finally
        {
            SaveNativePolicyButton.IsEnabled = true;
        }
    }
}
