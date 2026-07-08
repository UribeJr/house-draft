export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-black/15 border-t-[#f7941d]" />
      <p className="mt-4 text-sm text-zinc-500">Cutting to the Diary Room…</p>
    </div>
  );
}
