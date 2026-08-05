import { format, isToday, isYesterday, isThisYear, differenceInMinutes, differenceInHours, parseISO } from "date-fns";

export function formatMessageTime(dateInput: Date | string): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;

  return format(date, "h:mm a"); // e.g. "10:45 AM"
}

export function formatConversationPreview(dateInput: Date | string): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;

  const now = new Date();
  const diffMins = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24 && isToday(date)) return `${diffHours}h`;
  
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "MMM d"); // e.g., Jul 29
  
  return format(date, "MMM d, yyyy"); // e.g., Jul 29, 2023
}

export function formatMessageDivider(dateInput: Date | string): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "MMMM d");
  
  return format(date, "MMMM d, yyyy");
}

export function formatLastSeen(dateInput: Date | string): string {
  if (!dateInput) return "Last seen recently";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  
  const now = new Date();
  const diffMins = differenceInMinutes(now, date);
  
  if (diffMins < 5) return "Last seen just now";
  if (isToday(date)) return `Last seen today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Last seen yesterday at ${format(date, "h:mm a")}`;
  
  return `Last seen on ${format(date, "MMM d, yyyy")}`;
}
