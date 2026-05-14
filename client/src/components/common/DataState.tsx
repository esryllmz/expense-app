interface DataStateProps {
  loading?: boolean;
  empty?: boolean;
  loadingText?: string;
  emptyText?: string;
  colSpan: number;
}

export const DataState = ({
  loading,
  empty,
  loadingText = 'Yükleniyor...',
  emptyText = 'Kayıt bulunamadı.',
  colSpan,
}: DataStateProps) => {
  if (!loading && !empty) return null;

  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-8 text-center text-on-surface-variant"
      >
        {loading ? loadingText : emptyText}
      </td>
    </tr>
  );
};