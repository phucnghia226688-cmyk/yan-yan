import re

with open('src/components/AppointmentsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

button_code = """          <button
            onClick={() => onOpenQuickCheckIn()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-full text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4 shrink-0 fill-white" />
            <span>Chèn khách</span>
          </button>
          <button
            onClick={() => {
              setNewDate(selectedDate);
              setShowAddModal(true);
            }}"""

content = content.replace("""          <button
            onClick={() => {
              setNewDate(selectedDate);
              setShowAddModal(true);
            }}""", button_code)

with open('src/components/AppointmentsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
