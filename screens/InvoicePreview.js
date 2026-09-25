import React, { useContext, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { InvoiceContext } from '../context/InvoiceContext';
import { MenuContext } from '../context/MenuContext';
import { BusinessContext } from '../context/BusinessContext';
import { ThemeContext } from '../context/ThemeContext';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function InvoicePreviewScreen({ route, navigation }) {
  const { clientName, clientPhone, events, subTotal: previousSubTotal, taxAmount, grandTotal, transportCharge = 0, advanceAmount = 0, extraItems = [], autoDownload = false } = route.params;
  const { addInvoice } = useContext(InvoiceContext);
  const { tiffinItems } = useContext(MenuContext);
  const { businessProfile } = useContext(BusinessContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const invoiceDate = new Date().toLocaleDateString('en-IN');
  
  const subTotal = parseFloat(grandTotal);
  const transportAmount = parseFloat(transportCharge);
  const advanceAmt = parseFloat(advanceAmount);
  const finalTotal = subTotal + transportAmount;
  const balanceDue = finalTotal - advanceAmt;

  React.useEffect(() => {
    if (autoDownload) {
      setTimeout(() => {
        handleDownloadPdf();
      }, 500);
    }
  }, []);

  const orderedEvents = useMemo(
    () =>
      events
        .map((ev, index) => {
          const orderedTiffins = tiffinItems.filter((item) => (ev.tiffinQuantities[item.id] || 0) > 0);
          return {
            ...ev,
            index,
            orderedTiffins,
          };
        })
        .filter((ev) => ev.orderedTiffins.length > 0 || ev.addedMeals.length > 0),
    [events, tiffinItems]
  );

  const totalVisibleRows = useMemo(
    () =>
      orderedEvents.reduce(
        (sum, ev) => sum + ev.orderedTiffins.length + ev.addedMeals.length,
        0
      ),
    [orderedEvents]
  );

  const isShortInvoice = totalVisibleRows <= 6;
  const isLongInvoice = totalVisibleRows >= 16;

  const handleSaveInvoice = () => {
    const newInvoice = {
      id: Date.now().toString(),
      clientName,
      clientPhone,
      date: invoiceDate,
      events,
      subTotal: previousSubTotal,
      taxAmount,
      grandTotal: finalTotal.toFixed(2),
      transportCharge: transportAmount,
      advanceAmount: advanceAmt,
      extraItems
    };

    addInvoice(newInvoice);
    Alert.alert('Success', 'Invoice saved to History!');
    navigation.popToTop();
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Invoice for ${clientName}\nSubtotal: ₹${subTotal.toFixed(2)}\nTransport Charge: ₹${transportAmount.toFixed(2)}\nTotal Amount: ₹${finalTotal.toFixed(2)}\nAdvance: ₹${advanceAmt.toFixed(2)}\nBalance Due: ₹${balanceDue.toFixed(2)}\nGenerated via ${businessProfile?.name || 'our app'}`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const onWhatsAppShare = () => {
    const text = `*Invoice for ${clientName}*\n\n*Subtotal:* ₹${subTotal.toFixed(2)}\n*Transport Charge:* ₹${transportAmount.toFixed(2)}\n*Total Amount:* ₹${finalTotal.toFixed(2)}\n*Advance:* ₹${advanceAmt.toFixed(2)}\n*Balance Due:* ₹${balanceDue.toFixed(2)}\n\n_Generated via ${businessProfile?.name || 'our app'}_`;
    
    let phoneStr = clientPhone ? clientPhone.replace(/\D/g, '') : '';
    if (phoneStr && phoneStr.length === 10) phoneStr = '91' + phoneStr;
    
    let url = Platform.OS === 'web' 
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;
      
    if (phoneStr) {
        url += `&phone=${phoneStr}`;
    }
    
    Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Make sure WhatsApp is installed on your device');
    });
  };

  const getLogoDataUri = async () => {
    try {
      const logoAsset = Asset.fromModule(require('../assets/adaptive-icon.png'));
      await logoAsset.downloadAsync();
      const localUri = logoAsset.localUri || logoAsset.uri;

      if (!localUri) {
        return '';
      }

      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.log('Logo load skipped for PDF:', error);
      return '';
    }
  };

  const buildInvoiceHtml = (logoDataUri) => {
    const densityClass = totalVisibleRows <= 6 ? 'spacious' : totalVisibleRows >= 16 ? 'compact' : 'balanced';

    const eventBlocks = orderedEvents
      .map((ev) => {
        const tiffinRows = ev.orderedTiffins
          .map((item) => {
            const qty = ev.tiffinQuantities[item.id];
            const rowTotal = parseFloat(item.price) * qty;

            return `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.unit)}</td>
                <td style="text-align: center;">${qty}</td>
                <td style="text-align: right;">₹${escapeHtml(item.price)}</td>
                <td style="text-align: right;">₹${rowTotal.toFixed(2)}</td>
              </tr>
            `;
          })
          .join('');

        const mealRows = ev.addedMeals
          .map((meal) => {
            const rowTotal = meal.price * meal.quantity;

            return `
              <tr>
                <td>
                  <strong>${escapeHtml(meal.name)}</strong>
                  <div style="font-size: 0.85em; color: #555; margin-top: 4px;">${escapeHtml(meal.dishes.join(', '))}</div>
                </td>
                <td style="text-align: center;">${meal.quantity}</td>
                <td style="text-align: right;">₹${meal.price}</td>
                <td style="text-align: right;">₹${rowTotal.toFixed(2)}</td>
              </tr>
            `;
          })
          .join('');

        return `
          <section class="event-block">
            <h2>Day ${ev.index + 1} - ${escapeHtml(new Date(ev.date).toLocaleDateString('en-GB'))}</h2>
            ${
              tiffinRows
                ? `
                  <h3>Tiffin Items</h3>
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 40%;">Item</th>
                        <th style="width: 15%;">Unit</th>
                        <th style="width: 10%; text-align: center;">Qty</th>
                        <th style="width: 15%; text-align: right;">Rate</th>
                        <th style="width: 20%; text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>${tiffinRows}</tbody>
                  </table>
                `
                : ''
            }
            ${
              mealRows
                ? `
                  <h3>Meal Packages</h3>
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 55%;">Package & Dishes</th>
                        <th style="width: 10%; text-align: center;">Qty</th>
                        <th style="width: 15%; text-align: right;">Rate</th>
                        <th style="width: 20%; text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>${mealRows}</tbody>
                  </table>
                `
                : ''
            }
          </section>
        `;
      })
      .join('');

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4;
              margin: 18mm 14mm;
            }
            body {
              font-family: Arial, sans-serif;
              color: #1f2d3d;
            }
            body.spacious {
              font-size: 15px;
            }
            body.balanced {
              font-size: 13px;
            }
            body.compact {
              font-size: 11px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
              border-bottom: 2px solid #3498db;
              padding-bottom: 14px;
              margin-bottom: 16px;
            }
            .brand-wrap {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .logo {
              width: 64px;
              height: 64px;
              border-radius: 16px;
              object-fit: cover;
              border: 1px solid #d9e8f0;
            }
            .brand {
              font-size: 2em;
              font-weight: 700;
              color: #1f3c58;
            }
            .sub {
              color: #6b7c8c;
              margin-top: 4px;
            }
            .contact {
              margin-top: 10px;
              font-size: 0.92em;
              color: #4f6272;
              line-height: 1.6;
            }
            .badge {
              background: #eef6fb;
              color: #3498db;
              padding: 8px 12px;
              border-radius: 10px;
              font-weight: 700;
              white-space: nowrap;
            }
            .meta {
              margin-bottom: 18px;
              line-height: 1.7;
              font-size: 1em;
            }
            .event-block {
              margin-bottom: 18px;
            }
            h2 {
              font-size: 1.2em;
              color: #2980b9;
              margin-bottom: 10px;
            }
            h3 {
              font-size: 1em;
              color: #4f6272;
              margin: 12px 0 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
            }
            th, td {
              border: 1px solid #d8e3ea;
              padding: 0.65em 0.8em;
              font-size: 0.95em;
              text-align: left;
              vertical-align: top;
              word-break: break-word;
            }
            th {
              background: #f4f9fc;
              color: #2c3e50;
            }
            .grand-total {
              margin-top: 22px;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 8px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              width: 250px;
              font-size: 1.05em;
              color: #4f6272;
            }
            .grand-total-box {
              background: #f4fbf6;
              border: 1px solid #bfe6ca;
              border-radius: 12px;
              padding: 12px 16px;
              font-size: 1.15em;
              font-weight: 700;
              color: #1e8449;
              display: flex;
              justify-content: space-between;
              width: 250px;
            }
          </style>
        </head>
        <body class="${densityClass}">
          <div class="header">
            <div>
              <div class="brand-wrap">
                ${logoDataUri ? `<img src="${logoDataUri}" alt="${escapeHtml(businessProfile?.name || '')} logo" class="logo" />` : ''}
                <div>
                  <div class="brand">${escapeHtml(businessProfile?.name || '')}</div>
                  <div class="sub">${escapeHtml(businessProfile?.tagline || '')}</div>
                </div>
              </div>
              <div class="contact">
                <div><strong>Phone:</strong> ${escapeHtml(businessProfile?.phone || '')}</div>
                <div><strong>Email:</strong> ${escapeHtml(businessProfile?.email || '')}</div>
                <div><strong>Address:</strong> ${escapeHtml(businessProfile?.address || '')}</div>
              </div>
            </div>
            <div class="badge">INVOICE</div>
          </div>

          <div class="meta">
            <div><strong>Bill To:</strong> ${escapeHtml(clientName)}</div>
            ${clientPhone ? `<div><strong>Phone:</strong> ${escapeHtml(clientPhone)}</div>` : ''}
            <div><strong>Date:</strong> ${escapeHtml(invoiceDate)}</div>
          </div>

          ${eventBlocks}

          ${extraItems && extraItems.length > 0 ? `
          <div class="event-block">
            <div class="day-header">Extra Items & Charges</div>
            <table class="items-table">
              ${extraItems.map(item => `
                <tr>
                  <td>
                    <div class="item-name">${escapeHtml(item.description)}</div>
                  </td>
                  <td class="item-price">₹${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}

          <div class="grand-total">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subTotal.toFixed(2)}</span>
            </div>

            <div class="total-row">
              <span>Transport Charge:</span>
              <span>₹${transportAmount.toFixed(2)}</span>
            </div>
            
            <div class="total-row">
              <span><strong>Grand Total:</strong></span>
              <span><strong>₹${finalTotal.toFixed(2)}</strong></span>
            </div>

            <div class="total-row" style="color: #e53e3e;">
              <span>Advance Received:</span>
              <span>-₹${advanceAmt.toFixed(2)}</span>
            </div>

            <div class="grand-total-box" style="margin-top: 10px;">
              <span>Balance Due:</span>
              <span>₹${balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const logoDataUri = await getLogoDataUri();
      const html = buildInvoiceHtml(logoDataUri);
      
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });

        if (Platform.OS === 'android') {
          try {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
              const fileName = `Invoice_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
              const savedUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
              await FileSystem.writeAsStringAsync(savedUri, base64, { encoding: FileSystem.EncodingType.Base64 });
              Alert.alert('Saved', 'Invoice PDF saved to your selected folder successfully.');
            } else {
              // Fallback to sharing if permission denied
              await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
          } catch (e) {
            console.log("Storage access framework error", e);
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
          }
        } else {
          // iOS sharing to save
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Export Invoice PDF',
              UTI: '.pdf',
            });
          } else {
            Alert.alert('PDF Ready', `Invoice PDF created at:\n${uri}`);
          }
        }
      }
    } catch (error) {
      Alert.alert('PDF Error', 'Unable to generate the PDF right now.');
      console.log('PDF generation failed:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const dynamicStyles = useMemo(() => {
    if (isShortInvoice) {
      return {
        invoicePaper: styles.invoicePaperSpacious,
        companyName: styles.companyNameSpacious,
        clientName: styles.clientNameSpacious,
        dayHeader: styles.dayHeaderSpacious,
        dayHeaderText: styles.dayHeaderTextSpacious,
        itemName: styles.itemNameSpacious,
        itemDetail: styles.itemDetailSpacious,
        price: styles.priceSpacious,
        totalAmount: styles.totalAmountSpacious,
      };
    }

    if (isLongInvoice) {
      return {
        invoicePaper: styles.invoicePaperCompact,
        companyName: styles.companyNameCompact,
        clientName: styles.clientNameCompact,
        dayHeader: styles.dayHeaderCompact,
        dayHeaderText: styles.dayHeaderTextCompact,
        itemName: styles.itemNameCompact,
        itemDetail: styles.itemDetailCompact,
        price: styles.priceCompact,
        totalAmount: styles.totalAmountCompact,
      };
    }

    return {
      invoicePaper: null,
      companyName: null,
      clientName: null,
      dayHeader: null,
      dayHeaderText: null,
      itemName: null,
      itemDetail: null,
      price: null,
      totalAmount: null,
    };
  }, [isLongInvoice, isShortInvoice]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topActions}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.previewTitle}>Review Bill</Text>
        <TouchableOpacity onPress={onShare} style={styles.iconButton}>
          <Ionicons name="share-social-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.invoicePaper, dynamicStyles.invoicePaper]}
        contentContainerStyle={styles.invoicePaperContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.companyName, dynamicStyles.companyName]}>{businessProfile?.name || 'Company Name'}</Text>
            <Text style={styles.invoiceSubtitle}>{businessProfile?.tagline || ''}</Text>
            <Text style={styles.contactText}>{businessProfile?.phone || ''}</Text>
            <Text style={styles.contactText}>{businessProfile?.email || ''}</Text>
          </View>
          <View style={styles.invoiceBadge}>
            <Text style={styles.invoiceBadgeText}>INVOICE</Text>
          </View>
        </View>

        <View style={styles.billToSection}>
          <Text style={styles.label}>BILL TO:</Text>
          <Text style={[styles.clientNameText, dynamicStyles.clientName]}>{clientName}</Text>
          {clientPhone ? <Text style={styles.dateText}>{clientPhone}</Text> : null}
          <Text style={styles.dateText}>Date: {invoiceDate}</Text>
        </View>

        <View style={styles.divider} />

        {orderedEvents.map((ev) => (
          <View key={ev.id} style={styles.eventSection}>
            <View style={[styles.dayHeader, dynamicStyles.dayHeader]}>
              <Text style={[styles.dayHeaderText, dynamicStyles.dayHeaderText]}>
                Day {ev.index + 1} - {new Date(ev.date).toLocaleDateString('en-GB')}
              </Text>
            </View>

            {ev.orderedTiffins.map((item) => {
              const qty = ev.tiffinQuantities[item.id];
              const rowTotal = parseFloat(item.price) * qty;

              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <Text style={[styles.itemNameText, dynamicStyles.itemName]}>{item.name}</Text>
                    <Text style={[styles.itemSubDetail, dynamicStyles.itemDetail]}>
                      {qty} {item.unit} x ₹{item.price}
                    </Text>
                  </View>
                  <Text style={[styles.priceText, dynamicStyles.price]}>₹{rowTotal.toFixed(2)}</Text>
                </View>
              );
            })}

            {ev.addedMeals.map((meal) => {
              const rowTotal = meal.price * meal.quantity;

              return (
                <View key={meal.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <Text style={[styles.itemNameText, dynamicStyles.itemName]}>{meal.name}</Text>
                    <Text style={[styles.dishListText, dynamicStyles.itemDetail]}>
                      {meal.dishes.join(' | ')}
                    </Text>
                    <Text style={[styles.itemSubDetail, dynamicStyles.itemDetail]}>
                      {meal.quantity} plates x ₹{meal.price}
                    </Text>
                  </View>
                  <Text style={[styles.priceText, dynamicStyles.price]}>₹{rowTotal.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        ))}

        {extraItems && extraItems.length > 0 && (
          <View style={styles.eventSection}>
            <View style={[styles.dayHeader, dynamicStyles.dayHeader]}>
              <Text style={[styles.dayHeaderText, dynamicStyles.dayHeaderText]}>
                Extra Items & Charges
              </Text>
            </View>
            {extraItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <Text style={[styles.itemNameText, dynamicStyles.itemName]}>{item.description}</Text>
                </View>
                <Text style={[styles.priceText, dynamicStyles.price]}>₹{parseFloat(item.amount).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalBlock}>
          <View style={styles.totalRowSub}>
            <Text style={styles.totalLabelSub}>Subtotal</Text>
            <Text style={styles.totalAmountSub}>₹{subTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.totalRowSub}>
            <Text style={styles.totalLabelSub}>Transport Charge</Text>
            <Text style={styles.totalAmountSub}>₹{transportAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={[styles.totalAmount, dynamicStyles.totalAmount, { fontSize: 20 }]}>₹{finalTotal.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRowSub, { marginTop: 10 }]}>
            <Text style={[styles.totalLabelSub, { color: theme.error }]}>Advance Received (-)</Text>
            <Text style={[styles.totalAmountSub, { color: theme.error }]}>₹{advanceAmt.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={styles.totalLabel}>Balance Due</Text>
            <Text style={[styles.totalAmount, dynamicStyles.totalAmount, { color: theme.primary }]}>₹{balanceDue.toFixed(2)}</Text>
          </View>
          <View style={styles.bottomStatus}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={styles.statusText}> Computer Generated Invoice</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={handleDownloadPdf}
          disabled={isExportingPdf}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#3498db', '#2980b9']} style={styles.secondaryGradient}>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.secondaryActionText}>
              {isExportingPdf ? ' GENERATING...' : ' DOWNLOAD PDF'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={onWhatsAppShare}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#25D366', '#128C7E']} style={styles.secondaryGradient}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.secondaryActionText}> SHARE VIA WHATSAPP</Text>
          </LinearGradient>
        </TouchableOpacity>

        {!route.params?.isPreviewOnly && (
          <TouchableOpacity style={styles.primaryAction} onPress={handleSaveInvoice} activeOpacity={0.85}>
            <LinearGradient colors={['#27ae60', '#1e8449']} style={styles.primaryGradient}>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.primaryActionText}> SAVE TO RECORDS</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.background,
  },
  iconButton: { padding: 6 },
  previewTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  invoicePaper: {
    backgroundColor: theme.card,
    marginHorizontal: 15,
    borderRadius: 5,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: theme.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  invoicePaperContent: { paddingVertical: 20, paddingBottom: 60 },
  invoicePaperSpacious: { paddingHorizontal: 22 },
  invoicePaperCompact: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  headerLeft: { flex: 1, paddingRight: 16 },
  companyName: { fontSize: 22, fontWeight: '900', color: theme.text, letterSpacing: 1 },
  companyNameSpacious: { fontSize: 26 },
  companyNameCompact: { fontSize: 20 },
  invoiceSubtitle: { fontSize: 12, color: theme.textSecondary, fontWeight: '600', marginTop: 3 },
  contactText: { fontSize: 12, color: theme.textSecondary, marginTop: 3 },
  invoiceBadge: { backgroundColor: theme.inputBackground, padding: 8, borderRadius: 5 },
  invoiceBadgeText: { fontSize: 12, fontWeight: '800', color: theme.primary },
  billToSection: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: theme.textMuted, marginBottom: 4 },
  clientNameText: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  clientNameSpacious: { fontSize: 24 },
  clientNameCompact: { fontSize: 18 },
  dateText: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  divider: { height: 2, backgroundColor: theme.border, marginBottom: 20 },
  eventSection: { marginBottom: 25 },
  dayHeader: {
    backgroundColor: isDarkMode ? '#222' : '#fdfdfd',
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    paddingLeft: 10,
    marginBottom: 15,
    paddingVertical: 2,
  },
  dayHeaderSpacious: { paddingVertical: 4 },
  dayHeaderCompact: { marginBottom: 10 },
  dayHeaderText: { fontSize: 14, fontWeight: 'bold', color: theme.text },
  dayHeaderTextSpacious: { fontSize: 16 },
  dayHeaderTextCompact: { fontSize: 13 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  itemMain: { flex: 0.8, paddingRight: 10 },
  itemNameText: { fontSize: 15, fontWeight: '700', color: theme.text },
  itemNameSpacious: { fontSize: 17 },
  itemNameCompact: { fontSize: 14 },
  itemSubDetail: { fontSize: 12, color: theme.textSecondary, marginTop: 3 },
  itemDetailSpacious: { fontSize: 13 },
  itemDetailCompact: { fontSize: 11 },
  dishListText: { fontSize: 11, color: theme.textMuted, fontStyle: 'italic', marginVertical: 2 },
  priceText: { fontSize: 15, fontWeight: 'bold', color: theme.text },
  priceSpacious: { fontSize: 17 },
  priceCompact: { fontSize: 14 },
  totalBlock: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopStyle: 'dashed',
    borderTopColor: theme.border,
  },
  totalRowSub: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalLabelSub: { fontSize: 15, color: theme.textSecondary },
  totalAmountSub: { fontSize: 15, fontWeight: '600', color: theme.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: theme.textSecondary },
  totalAmount: { fontSize: 28, fontWeight: '900', color: theme.success },
  totalAmountSpacious: { fontSize: 32 },
  totalAmountCompact: { fontSize: 24 },
  bottomStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 15, justifyContent: 'center' },
  statusText: { fontSize: 10, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  actionBar: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 90,
    backgroundColor: theme.background,
  },
  secondaryAction: { marginBottom: 10 },
  primaryAction: {},
  secondaryGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  secondaryActionText: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.4 },
  primaryActionText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
