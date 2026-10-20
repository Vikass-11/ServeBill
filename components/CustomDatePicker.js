import React, { useState, useEffect, useContext } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CustomDatePicker({ visible, initialDate, onSelect, onClose }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
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
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.monthTitle}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <Text style={styles.selectPrompt}>SELECT EVENT DATE</Text>
            </View>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {DAYS.map(d => (
              <Text key={d} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          {renderCalendar()}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    backgroundColor: theme.card,
    borderRadius: 26,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDarkMode ? 0.4 : 0.12,
    shadowRadius: 24,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  arrowBtn: {
    padding: 10,
    backgroundColor: theme.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.3,
  },
  selectPrompt: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12
  },
  weekDayText: {
    color: theme.textMuted,
    fontWeight: '800',
    fontSize: 11,
    width: 38,
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
    marginBottom: 8,
    borderRadius: 16
  },
  todayCell: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  cellText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text
  },
  mutedText: {
    color: theme.border,
    opacity: 0.5
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelBtnText: {
    fontWeight: '800',
    fontSize: 13,
    color: theme.textSecondary
  }
});
