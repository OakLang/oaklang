import { LuBook, LuTrendingUp, LuWrench } from 'react-icons/lu';

const features = [
  {
    description:
      'Explore a curated collection of cutting-edge libraries. Stay ahead with expert-picked tools. Elevate your projects effortlessly.',
    icon: <LuBook size={22} />,
    title: 'Explore Cutting-Edge Libraries',
  },
  {
    description:
      "Stay inspired with real-time updates on your friends' projects. Explore innovative apps, groundbreaking code, and keep connected within your network.",
    icon: <LuWrench size={22} />,
    title: "Track Your Friends' Activity",
  },
  {
    description: 'Keep up with the latest tech trends you use. Stay informed, innovate confidently.',
    icon: <LuTrendingUp size={22} />,
    title: 'Stay Updated with Tech Trends',
  },
];

export const FeaturesGrid = () => {
  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title}>
            <div className="flex gap-3">
              {feature.icon}
              <p className="font-semibold">{feature.title}</p>
            </div>
            <p className="mt-3 text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
