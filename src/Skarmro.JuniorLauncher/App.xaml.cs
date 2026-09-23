using System.Threading;
using System.Windows;

namespace Skarmro.JuniorLauncher;

public partial class App : Application
{
    private Mutex? _singleInstanceMutex;

    private void Application_Startup(object sender, StartupEventArgs e)
    {
        _singleInstanceMutex = new Mutex(
            initiallyOwned: true,
            name: @"Local\SKARMRO-JuniorLauncher",
            createdNew: out var createdNew);

        if (!createdNew)
        {
            Shutdown(0);
            return;
        }

        var window = new MainWindow();
        MainWindow = window;
        window.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        try
        {
            _singleInstanceMutex?.ReleaseMutex();
        }
        catch
        {
            // The mutex may already have been released during abnormal shutdown.
        }

        _singleInstanceMutex?.Dispose();
        base.OnExit(e);
    }
}
