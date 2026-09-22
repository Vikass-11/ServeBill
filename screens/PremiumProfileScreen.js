import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BusinessContext } from '../context/BusinessContext';
import { ThemeContext } from '../context/ThemeContext';

export default function PremiumProfileScreen({ onLogout }) {
  const { businessProfile, updateBusinessProfile } = useContext(BusinessContext);
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  
  const [profileData, setProfileData] = useState({
    name: businessProfile?.name || '',
    tagline: businessProfile?.tagline || '',
    phone: businessProfile?.phone || '',
    email: businessProfile?.email || '',
    address: businessProfile?.address || '',
  });

  const handleSave = () => {
    updateBusinessProfile(profileData);
    Alert.alert("Success", "Business profile updated successfully!");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="business" size={50} color={theme.primary} />
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} style={{backgroundColor: theme.card, borderRadius: 10}} />
            </View>
          </View>
          <Text style={styles.name}>{profileData.name || 'Your Business'}</Text>
          <Text style={styles.email}>{profileData.email || 'Email Address'}</Text>
        </View>

        {/* Business Details Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput 
              style={styles.input}
              value={profileData.name}
              onChangeText={(text) => setProfileData({...profileData, name: text})}
              placeholder="e.g. SM Catering"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tagline</Text>
            <TextInput 
              style={styles.input}
              value={profileData.tagline}
              onChangeText={(text) => setProfileData({...profileData, tagline: text})}
              placeholder="e.g. Premium Food Services"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={styles.input}
              value={profileData.phone}
              onChangeText={(text) => setProfileData({...profileData, phone: text})}
              placeholder="e.g. +91 98765 43210"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input}
              value={profileData.email}
              onChangeText={(text) => setProfileData({...profileData, email: text})}
              placeholder="e.g. contact@business.com"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput 
              style={[styles.input, styles.textArea]}
              value={profileData.address}
              onChangeText={(text) => setProfileData({...profileData, address: text})}
              placeholder="Full business address for invoices"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        {/* Preferences */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={22} color={theme.text} style={{marginRight: 10}} />
              <Text style={styles.preferenceLabel}>Dark Mode</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={styles.toggleSwitch}>
              <View style={[styles.toggleThumb, isDarkMode && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.spacer} />
        
        {/* Logout Button */}
        {onLogout && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" style={{marginRight: 10}} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Space for the custom tab bar */}
        <View style={{height: 100}} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background, 
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.primaryLight, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.card,
    shadowColor: theme.shadow,
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
    color: theme.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  formContainer: {
    backgroundColor: theme.card,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  spacer: {
    height: 30,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.inputBorder,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    backgroundColor: theme.primary,
    transform: [{ translateX: 20 }],
  },
  logoutContainer: {
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
