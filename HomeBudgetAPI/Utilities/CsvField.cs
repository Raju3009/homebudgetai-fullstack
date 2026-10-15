namespace HomeBudgetAPI.Utilities;

public static class CsvField
{
    public static string Escape(string value)
    {
        var firstValue = value.TrimStart(' ', '\t', '\r', '\n', '\uFEFF');
        var safeValue = firstValue.Length > 0 && firstValue[0] is '=' or '+' or '-' or '@'
            ? $"'{value}"
            : value;

        return $"\"{safeValue.Replace("\"", "\"\"")}\"";
    }
}
