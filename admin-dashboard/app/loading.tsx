export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
        <p className="text-lg text-gray-800">Loading Dashboard...</p>
      </div>
    </div>
  );
}
