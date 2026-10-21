import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (formattedDate: string) => void;
  initialDate?: string;
  title?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  initialDate = '',
  title = 'Select Date',
}) => {
  // Try to parse initial date (e.g. "17 October 1997" or "1997-10-17")
  const parseInitialDate = () => {
    if (!initialDate) return new Date();
    const parsed = new Date(initialDate);
    if (!isNaN(parsed.getTime())) return parsed;

    // Check "17 October 1997" format
    const parts = initialDate.trim().split(/\s+/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthIdx = MONTHS.findIndex((m) => m.toLowerCase().startsWith(parts[1].toLowerCase()));
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
        return new Date(year, monthIdx, day);
      }
    }
    return new Date();
  };

  const initialParsed = parseInitialDate();
  const [selectedYear, setSelectedYear] = useState<number>(initialParsed.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(initialParsed.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(initialParsed.getDate());

  if (!isOpen) return null;

  // Days in month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 is Sun

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleConfirm = () => {
    // Format as "17 October 1997"
    const formatted = `${selectedDay} ${MONTHS[selectedMonth]} ${selectedYear}`;
    onSelectDate(formatted);
    onClose();
  };

  // Generate Year options (1950 to 2035)
  const years = Array.from({ length: 86 }, (_, i) => 2035 - i);

  return (
    <div className="admin-modal fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn cursor-default">
      <div className="w-full max-w-sm rounded-2xl bg-[#140b27] border border-amber-500/30 p-5 shadow-2xl text-[#f0ead8] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Month & Year Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 flex-1 justify-center">
            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx} className="bg-[#140b27] text-white">
                  {m}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-[#140b27] text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/40 font-semibold uppercase">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <span key={`empty_${i}`} className="p-2" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected = selectedDay === dayNum;
            return (
              <button
                key={`day_${dayNum}`}
                onClick={() => setSelectedDay(dayNum)}
                className={`p-2 rounded-lg font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/25'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Preview of chosen date */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <span className="text-white/50">Formatted Output:</span>
          <span className="font-semibold text-amber-300">
            {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
          </span>
        </div>

        {/* Quick Presets & Confirm */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              // Quick Nasir DOB preset
              setSelectedYear(1997);
              setSelectedMonth(9); // October (0-indexed 9)
              setSelectedDay(17);
            }}
            className="text-[11px] text-amber-400 hover:underline cursor-pointer"
          >
            Nasir's DOB (17 Oct 1997)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black flex items-center gap-1 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Check size={14} /> Set Date
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
