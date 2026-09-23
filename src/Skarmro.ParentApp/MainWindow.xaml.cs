using System;
using System.Windows;

namespace Skarmro.ParentApp;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        ActiveRoutineText.Text = GetRoutineLabel();
    }

    private static string GetRoutineLabel()
    {
        var hour = DateTime.Now.Hour;
        return hour >= 20 || hour < 7 ? "Läggdags" : "Ingen";
    }
}
