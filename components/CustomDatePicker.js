import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CustomDatePicker({ visible, initialDate, onSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    if (initialDate && !isNaN(new Date(initialDate).getTime())) {
      const d = new Date(initialDate);
      d.setDate(1); // Set to 1st of month to avoid overflow bugs
      setCurrentMonth(d);
    } else {
      const d = new Date();
      d.setDate(1);
      setCurrentMonth(d);
    }
  }, [initialDate, visible]);

  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const prevDaysInMonth = getDaysInMonth(year, month - 1);

    const cells = [];
    
    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({ day: prevDaysInMonth - i, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ day: i, isCurrentMonth: true });
    }
    
    // Next month days
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({ day: i, isCurrentMonth: false });
    }

    return (
      <View style={styles.grid}>
        {cells.map((cell, index) => {
          const isToday = cell.isCurrentMonth && 
            new Date().getDate() === cell.day && 
            new Date().getMonth() === month && 
            new Date().getFullYear() === year;

          return (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.cell, 
                isToday && styles.todayCell
              ]}
              disabled={!cell.isCurrentMonth}
              onPress={() => {
                if (cell.isCurrentMonth) {
                  onSelect(new Date(year, month, cell.day));
                }
              }}
            >
              <Text style={[
                styles.cellText, 
                !cell.isCurrentMonth && styles.mutedText,
                isToday && styles.todayText
              ]}>
                {cell.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
              <Ionicons name="chevron-back" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {DAYS.map(d => (
              <Text key={d} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          {renderCalendar()}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  arrowBtn: {
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 12
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111'
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10
  },
  weekDayText: {
    color: '#888',
    fontWeight: '700',
    fontSize: 13,
    width: 40,
    textAlign: 'center'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  cell: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 20
  },
  todayCell: {
    backgroundColor: '#FF7F50'
  },
  cellText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111'
  },
  mutedText: {
    color: '#ddd'
  },
  todayText: {
    color: '#fff'
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12
  },
  cancelBtnText: {
    fontWeight: '700',
    color: '#111'
  }
});
