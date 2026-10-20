import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessContext } from '../context/BusinessContext';
import { ThemeContext } from '../context/ThemeContext';

export default function PremiumProfileScreen({ navigation, onLogout }) {
  const { businessProfile, updateBusinessProfile } = useContext(BusinessContext);
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  
  const [profileData, setProfileData] = useState({
    name: businessProfile?.name || '',
    tagline: businessProfile?.tagline || '',
    phone: businessProfile?.phone || '',
    email: businessProfile?.email || '',
    address: businessProfile?.address || '',
  });

  const handleSave = () => {
    updateBusinessProfile(profileData);
    Alert.alert("Success", "Business profile & invoice header updated successfully!");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER WITH BACK BUTTON */}
      <View style={styles.navHeader}>
        {navigation && navigation.canGoBack && navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: navigation && navigation.canGoBack && navigation.canGoBack() ? 10 : 0 }}>
          <Text style={styles.navTitle}>Business Settings</Text>
          <Text style={styles.navSubtitle}>Brand identity, invoice headers & preferences</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* LIVE INVOICE BRANDING PREVIEW CARD */}
        <View style={styles.previewCardContainer}>
          <Text style={styles.previewHeaderLabel}>LIVE INVOICE HEADER PREVIEW</Text>
          <LinearGradient
            colors={isDarkMode ? ['#131B2E', '#0B101D'] : ['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCard}
          >
            <View style={styles.previewTopRow}>
              <View style={styles.previewAvatar}>
                <Ionicons name="business" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.previewBizName} numberOfLines={1}>
                  {profileData.name || 'Your Business Name'}
                </Text>
                <Text style={styles.previewTagline} numberOfLines={1}>
                  {profileData.tagline || 'Catering & Food Services'}
                </Text>
              </View>
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>VERIFIED</Text>
              </View>
            </View>

            <View style={styles.previewDivider} />

            <View style={styles.previewContactRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewContactText} numberOfLines={1}>
                  <Ionicons name="call" size={12} color="#34D399" /> {profileData.phone || '+91 98765 43210'}
                </Text>
                <Text style={styles.previewContactText} numberOfLines={1}>
                  <Ionicons name="mail" size={12} color="#60A5FA" /> {profileData.email || 'billing@business.com'}
                </Text>
              </View>
              <Text style={styles.previewAddressText} numberOfLines={2}>
                <Ionicons name="location" size={12} color="#F87171" /> {profileData.address || 'Business billing address'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* BUSINESS DETAILS FORM */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Invoice & Company Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>BUSINESS / BRAND NAME *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="business-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={profileData.name}
                onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                placeholder="e.g. SM Catering & Sweets"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>BUSINESS TAGLINE</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="pricetag-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={profileData.tagline}
                onChangeText={(text) => setProfileData({ ...profileData, tagline: text })}
                placeholder="e.g. Premium Catering & Food Services"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>OFFICIAL PHONE NUMBER</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={profileData.phone}
                onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={profileData.email}
                onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                placeholder="e.g. contact@smcatering.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>BILLING ADDRESS</Text>
            <View style={[styles.inputWrap, { height: 90, alignItems: 'flex-start', paddingTop: 12 }]}>
              <Ionicons name="location-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                value={profileData.address}
                onChangeText={(text) => setProfileData({ ...profileData, address: text })}
                placeholder="Full address printed on invoices and receipts"
                placeholderTextColor={theme.textMuted}
                multiline
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.88} onPress={handleSave}>
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Profile & Header</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* PREFERENCES SECTION */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>App Preferences & Security</Text>
          
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.prefIconWrap, { backgroundColor: isDarkMode ? '#2B1A3A' : '#F5F3FF' }]}>
                <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={isDarkMode ? '#A78BFA' : '#F59E0B'} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.preferenceLabel}>Appearance</Text>
                <Text style={styles.preferenceSub}>{isDarkMode ? 'Dark Mode (Midnight)' : 'Light Mode (Clean)'}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={toggleTheme} style={styles.toggleSwitch} activeOpacity={0.8}>
              <View style={[styles.toggleThumb, isDarkMode && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.preferenceDivider} />

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.prefIconWrap, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.preferenceLabel}>Data Security</Text>
                <Text style={styles.preferenceSub}>Device Biometrics • Offline Encrypted</Text>
              </View>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Protected</Text>
            </View>
          </View>
        </View>

        {/* LOGOUT / LOCK WORKSPACE */}
        {onLogout && (
          <TouchableOpacity style={styles.lockBtn} activeOpacity={0.85} onPress={onLogout}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.error} style={{ marginRight: 8 }} />
            <Text style={styles.lockBtnText}>Lock Workspace Vault</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  navHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.4,
  },
  navSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  previewCardContainer: {
    marginBottom: 20,
  },
  previewHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  previewCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDarkMode ? 0.35 : 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBizName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  previewTagline: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  previewBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewBadgeText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 14,
  },
  previewContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewContactText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 3,
  },
  previewAddressText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 140,
    textAlign: 'right',
  },
  formContainer: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.25 : 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 13,
  },
  saveBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prefIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  preferenceSub: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  toggleSwitch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.inputBackground,
    justifyContent: 'center',
    padding: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.textSecondary,
  },
  toggleThumbActive: {
    backgroundColor: theme.primary,
    transform: [{ translateX: 22 }],
  },
  activePill: {
    backgroundColor: theme.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.success,
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderRadius: 18,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: theme.errorLight,
    marginBottom: 20,
  },
  lockBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.error,
  },
});
