namespace HomeBudgetAPI.Services;

public interface IInsightService
{
    IReadOnlyList<string> CreateSuggestions(decimal income, decimal expenses, IReadOnlyDictionary<string, decimal> categories);
}

public class InsightService : IInsightService
{
    public IReadOnlyList<string> CreateSuggestions(decimal income, decimal expenses, IReadOnlyDictionary<string, decimal> categories)
    {
        var result = new List<string>();
        var balance = income - expenses;
        if (income <= 0) result.Add("Add recurring income to unlock better cash-flow forecasts.");
        if (income > 0 && expenses / income > 0.8m) result.Add("Spending is above 80% of income. Review subscriptions and flexible categories this week.");
        if (balance > 0) result.Add($"You are projected to keep {balance:C0}. Consider moving at least 20% into savings or debt payoff.");
        var top = categories.OrderByDescending(x => x.Value).FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(top.Key)) result.Add($"{top.Key} is your largest expense area. Set a category cap and track it weekly.");
        if (result.Count == 0) result.Add("Your budget is balanced. Keep logging transactions to improve monthly recommendations.");
        return result.Take(4).ToList();
    }
}
