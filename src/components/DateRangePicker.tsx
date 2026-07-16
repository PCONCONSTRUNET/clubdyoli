"use client";
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange 
}: { 
  startDate: string, 
  endDate: string, 
  onStartChange: (d: string) => void, 
  onEndChange: (d: string) => void 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 0 = selecting start, 1 = selecting end
  const [selectingMode, setSelectingMode] = useState<0 | 1>(0);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const handleDateClick = (day: number) => {
    // Format YYYY-MM-DD
    const strDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (selectingMode === 0) {
      onStartChange(strDate);
      setSelectingMode(1);
    } else {
      if (startDate && new Date(strDate) < new Date(startDate)) {
        onStartChange(strDate);
        onEndChange("");
      } else {
        onEndChange(strDate);
        setSelectingMode(0);
      }
    }
  };

  const isSelected = (day: number) => {
    const strDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return strDate === startDate || strDate === endDate;
  };
  
  const isBetween = (day: number) => {
    if (!startDate || !endDate) return false;
    const current = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    return current > new Date(startDate) && current < new Date(endDate);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm w-64 select-none">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-50"><ChevronLeft size={16} /></button>
        <div className="font-bold text-gray-900 text-sm">
          {MONTHS[month]} {year}
        </div>
        <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-50"><ChevronRight size={16} /></button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAYS.map((d, i) => (
          <div key={i} className="text-xs font-bold text-gray-400">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {blanks.map(b => (
          <div key={`blank-${b}`} className="h-8 w-8"></div>
        ))}
        {days.map(d => {
          const selected = isSelected(d);
          const between = isBetween(d);
          return (
            <div key={d} className={`h-8 flex items-center justify-center relative cursor-pointer group`} onClick={() => handleDateClick(d)}>
              {between && <div className="absolute inset-y-0 left-0 right-0 bg-[#ff1493]/10"></div>}
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium z-10 transition-colors
                ${selected ? 'bg-[#ff1493] text-white shadow-md' : 
                  between ? 'text-[#ff1493]' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
              `}>
                {d}
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 flex flex-col gap-2 border-t border-gray-50 pt-3">
        <div className="flex justify-between text-xs items-center cursor-pointer" onClick={() => setSelectingMode(0)}>
          <span className={`${selectingMode === 0 ? 'text-[#ff1493] font-bold' : 'text-gray-400 font-bold'}`}>Data Inicial:</span>
          <span className="text-gray-900 font-bold">{startDate ? startDate.split('-').reverse().join('/') : '--/--/----'}</span>
        </div>
        <div className="flex justify-between text-xs items-center cursor-pointer" onClick={() => setSelectingMode(1)}>
          <span className={`${selectingMode === 1 ? 'text-[#ff1493] font-bold' : 'text-gray-400 font-bold'}`}>Data Final:</span>
          <span className="text-gray-900 font-bold">{endDate ? endDate.split('-').reverse().join('/') : '--/--/----'}</span>
        </div>
      </div>
    </div>
  );
}
