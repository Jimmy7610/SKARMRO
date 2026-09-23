using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Input;

namespace Skarmro.JuniorLauncher;

public partial class MainWindow : Window
{
    private bool _allowClose;

    public MainWindow()
    {
        InitializeComponent();
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
