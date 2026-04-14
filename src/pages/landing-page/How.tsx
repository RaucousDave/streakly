import { STEPS } from "@/App";

export default function How() {
  return (
    <section id="how" className="py-24 px-6 ">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-4">
          How it works
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-100 mb-16">
          Three steps to a habit
          <br />
          you'll actually keep.
        </h2>

        <div className="grid sm:grid-cols-3 gap-10">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="text-5xl font-bold text-zinc-400 select-none">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold text-zinc-100 mt-2 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
