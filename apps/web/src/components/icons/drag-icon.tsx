import type { SVGProps } from "react";

export function ReorderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="prefix__lucide prefix__lucide-grip-vertical"
      {...props}
    >
      <circle cx={9} cy={12} r={1} />
      <circle cx={9} cy={5} r={1} />
      <circle cx={9} cy={19} r={1} />
      <circle cx={15} cy={12} r={1} />
      <circle cx={15} cy={5} r={1} />
      <circle cx={15} cy={19} r={1} />
    </svg>
  );
}
