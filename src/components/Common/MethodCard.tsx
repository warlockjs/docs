import React from "react";

interface MethodCardProps {
  name: string;
  description: string;
  href?: string;
  badge?: "Essential" | "Common" | "Advanced" | "Specialized";
  type?: "mutator" | "validator";
}

const MethodCard: React.FC<MethodCardProps> = ({
  name,
  description,
  href,
  type = "validator",
}) => {
  // Create tooltip content with type and description
  const tooltipContent = `${
    type === "mutator" ? "🔄 Mutator" : "✅ Validator"
  }: ${description}`;

  // Simplified content - just method name with tooltip
  const content = (
    <div
      className="method-card text-start p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4"
      style={{
        borderLeftColor:
          type === "mutator" ? "var(--ifm-color-primary)" : "#10b981",
        color: "var(--ifm-font-color-primary)",
        border: "1px solid var(--ifm-color-emphasis-200)",
      }}
      title={tooltipContent}
    >
      <span className="text-sm font-mono font-bold">{name}</span>
    </div>
  );

  // Always wrap in link if href is provided
  if (href) {
    return (
      <a
        href={href}
        className="block hover:no-underline"
        style={{ textDecoration: "none" }}
        title={tooltipContent}
      >
        {content}
      </a>
    );
  }

  return content;
};

export default MethodCard;
