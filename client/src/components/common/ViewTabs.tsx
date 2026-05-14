interface ViewTabsProps<T extends string> {
  value: T;
  items: Array<{
    label: string;
    value: T;
  }>;
  onChange: (value: T) => void;
}

export const ViewTabs = <T extends string>({
  value,
  items,
  onChange,
}: ViewTabsProps<T>) => {
  return (
    <div className="inline-flex p-1 rounded-2xl bg-surface-container-low border border-outline-variant/20">
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
              active
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};