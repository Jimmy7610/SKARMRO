using System;
using System.Windows;

namespace Skarmro.ParentApp;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        ActiveRoutineText.Text = GetRoutineLabel();
        RefreshNativeHealth();
    }

    private static string GetRoutineLabel()
    {
        var hour = DateTime.Now.Hour;
        return hour >= 20 || hour < 7 ? "Läggdags" : "Ingen";
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

        NativePolicyHealthText.Text = health.PolicyValid
            ? $"✓  Native policy giltig · enforcement {(health.EnforcementEnabled ? "på" : "av")}"
            : $"!  Native policy: {health.PolicyReason}";
    }

    private void SaveNativePolicy_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var policy = NativePolicyStore.CreateBaseline("SkarmroChild");
            NativePolicyStore.Write(policy);

            MessageBox.Show(
                "Native app-policy sparades för SkarmroChild.\n\n" +
                "Smart App Control har inte ändrats.",
                "SKÄRMRO",
                MessageBoxButton.OK,
                MessageBoxImage.Information);

            RefreshNativeHealth();
        }
        catch (UnauthorizedAccessException)
        {
            MessageBox.Show(
                "Native policy kräver administratörsbehörighet.",
                "SKÄRMRO",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "Kunde inte spara native policy.\n\n" + ex.Message,
                "SKÄRMRO",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
    }
}
