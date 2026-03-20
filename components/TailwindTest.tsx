export default function TailwindTest() {
  return (
    <div className="fixed top-4 right-4 z-50 p-4 bg-red-500 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2">Tailwind Test</h2>
      <div className="space-y-2">
        <div className="p-2 bg-lightMainBG text-lightMainColor rounded">
          Custom: lightMainBG & lightMainColor
        </div>
        <div className="p-2 bg-franceBlue text-white rounded">
          Custom: franceBlue
        </div>
        <div className="p-2 bg-blue-500 text-white rounded">
          Default: blue-500
        </div>
      </div>
    </div>
  );
}
