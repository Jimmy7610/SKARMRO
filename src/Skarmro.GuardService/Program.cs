using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Skarmro.GuardService;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "SkarmroGuardService";
});

builder.Services.AddHostedService<GuardWorker>();
builder.Services.AddHostedService<PolicyIpcServer>();

var host = builder.Build();
await host.RunAsync();
