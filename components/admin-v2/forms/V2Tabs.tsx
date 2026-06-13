import { Tab, Tabs } from "@mui/material";

export function V2Tabs({ value, onChange, items }: { value: string; onChange: (value: string) => void; items: Array<{ label: string; value: string }> }) {
  return (
    <Tabs value={value} onChange={(_, next) => onChange(next)} variant="scrollable" scrollButtons="auto">
      {items.map((item) => (
        <Tab key={item.value} label={item.label} value={item.value} />
      ))}
    </Tabs>
  );
}
