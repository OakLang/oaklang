import { APP_NAME } from "@acme/core/constants";

export default function Home() {
  return (
    <div className="my-32">
      <h1 className="text-center text-5xl font-semibold">
        Welcome to {APP_NAME}
      </h1>
    </div>
  );
}
