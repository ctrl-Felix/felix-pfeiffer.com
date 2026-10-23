export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[13px] text-[#0a84ff] hover:underline">
      ‹ All tests
    </button>
  );
}
