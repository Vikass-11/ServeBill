import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileItem = ({ icon, title, isLogout, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <Ionicons name={icon} size={22} color={isLogout ? "#333" : "#555"} style={styles.menuIcon} />
      <Text style={[styles.menuText, isLogout && { fontWeight: '600' }]}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);

export default function PremiumProfileScreen({ onLogout }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {/* Using a placeholder avatar color matching the light theme */}
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#FF7F50" />
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={20} color="#FF7F50" style={{backgroundColor: '#fff', borderRadius: 10}} />
            </View>
          </View>
          <Text style={styles.name}>Admin User</Text>
          <Text style={styles.email}>admin@servebill.com</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <ProfileItem icon="person-outline" title="Personal Information" />
          <ProfileItem icon="pricetag-outline" title="My Invoices" />
          <ProfileItem icon="location-outline" title="Addresses" />
          <ProfileItem icon="card-outline" title="Payment Methods" />
          <ProfileItem icon="settings-outline" title="Settings" />
          <ProfileItem icon="help-circle-outline" title="Help & Support" />
          
          <View style={styles.spacer} />
          
          <ProfileItem icon="log-out-outline" title="Logout" isLogout={true} onPress={onLogout} />
        </View>
        
        {/* Space for the custom tab bar */}
        <View style={{height: 100}} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Off-white/cream background matching the image
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE5D9', // Light orange tint
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  spacer: {
    height: 20,
  },
});
