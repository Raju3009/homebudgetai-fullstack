namespace HomeBudgetAPI.Models
{
    public class Expense
    {
        public int Id { get; set; }

        public string Title { get; set; } = "";

        public int Amount { get; set; }

        public string Category { get; set; } = "";

        public DateTime Date { get; set; } = DateTime.Now;

        // 🔐 ADD THIS (IMPORTANT)
        public string UserEmail { get; set; } = "";
    }
}