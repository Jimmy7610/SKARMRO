Console.Title = "SKARMRO AppLocker Probe";
Console.WriteLine("SKARMRO BLOCKED PROBE");
Console.WriteLine("If you can see this while the future enforce-policy is active for the child account, enforcement failed.");
Console.WriteLine();
Console.WriteLine($"User: {Environment.UserDomainName}\\{Environment.UserName}");
Console.WriteLine($"Machine: {Environment.MachineName}");
Console.WriteLine("Press Enter to exit.");
Console.ReadLine();
