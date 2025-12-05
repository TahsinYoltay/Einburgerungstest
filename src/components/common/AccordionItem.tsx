import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useAppTheme } from '../../providers/ThemeProvider';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, initiallyOpen = false }) => {
  const { theme } = useAppTheme();
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  // ... (rest of the component)
  return (
    <View style={[styles.container, { borderTopColor: theme.dark ? theme.colors.outlineVariant : '#E5E7EB' }]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
        <Icon 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={theme.colors.primary} 
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.content}>
           {children}
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 8,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  content: {
    paddingBottom: 8,
    paddingTop: 4,
  }
});

export default AccordionItem;
