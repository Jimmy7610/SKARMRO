using System.IO.Pipes;
using System.Text;
using System.Text.Json;

namespace Skarmro.ParentApp;

public static class GuardPolicyClient
{
    private const string PipeName = "SKARMRO.Policy.v1";

    public static async Task<GuardPolicyResponse> SaveAsync(
        NativeAppPolicy policy,
        CancellationToken cancellationToken = default)
    {
        using var pipe = new NamedPipeClientStream(
            ".",
            PipeName,
            PipeDirection.InOut,
            PipeOptions.Asynchronous);

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(5));

        try
        {
            await pipe.ConnectAsync(timeout.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new GuardPolicyResponse(false, "Guard Service svarade inte inom 5 sekunder.");
        }
        catch (Exception ex)
        {
            return new GuardPolicyResponse(false, "Kunde inte ansluta till Guard Service: " + ex.Message);
        }

        var request = new
        {
            action = "save-policy",
            policy
        };

        using var writer = new StreamWriter(pipe, Encoding.UTF8, 4096, leaveOpen: true)
        {
            AutoFlush = true
        };

        using var reader = new StreamReader(pipe, Encoding.UTF8, false, 4096, leaveOpen: true);

        await writer.WriteLineAsync(JsonSerializer.Serialize(request).AsMemory(), timeout.Token);

        var responseLine = await reader.ReadLineAsync(timeout.Token);
        if (string.IsNullOrWhiteSpace(responseLine))
            return new GuardPolicyResponse(false, "Guard Service gav inget svar.");

        try
        {
            var response = JsonSerializer.Deserialize<GuardPolicyResponse>(
                responseLine,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return response ?? new GuardPolicyResponse(false, "Ogiltigt svar från Guard Service.");
        }
        catch (JsonException)
        {
            return new GuardPolicyResponse(false, "Guard Service gav ett ogiltigt svar.");
        }
    }
}

public sealed record GuardPolicyResponse(bool Success, string Message);
