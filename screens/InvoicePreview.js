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
  const {
    clientName = '',
    clientPhone = '',
    events = [],
    subTotal: previousSubTotal,
    taxAmount = 0,
    grandTotal = 0,
    transportCharge = 0,
    advanceAmount = 0,
    extraItems = [],
    autoDownload = false,
  } = route.params || {};

  const { addInvoice } = useContext(InvoiceContext);
  const { tiffinItems } = useContext(MenuContext);
  const { businessProfile } = useContext(BusinessContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  const invoiceDate = new Date().toLocaleDateString('en-IN');
  
  const dayTransportList = (events || [])
    .map((ev, i) => ({
      day: i + 1,
      date: ev.date,
      amount: parseFloat(ev.transportCharge) || 0,
    }))
    .filter((d) => d.amount > 0);
  const totalDaysTransport = dayTransportList.reduce((sum, d) => sum + d.amount, 0);
  const transportAmount = totalDaysTransport > 0
    ? totalDaysTransport + (parseFloat(transportCharge) > totalDaysTransport ? parseFloat(transportCharge) - totalDaysTransport : 0)
    : (parseFloat(transportCharge) || 0);

  const advanceAmt = parseFloat(advanceAmount) || 0;
  const extraTotal = (extraItems || []).reduce((sum, item) => sum + (parseFloat(item?.amount) || 0), 0);

  // Subtotal is the items total. If previousSubTotal was provided, use it; otherwise compute from grandTotal
  const subTotal = previousSubTotal !== undefined
    ? parseFloat(previousSubTotal) || 0
    : Math.max(0, (parseFloat(grandTotal) || 0) - transportAmount - extraTotal);

  const finalTotal = route.params?.grandTotal
    ? parseFloat(route.params.grandTotal)
    : (subTotal + transportAmount + extraTotal);

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
      (events || [])
        .map((ev, index) => {
          if (!ev) return null;
          const orderedTiffins = (tiffinItems || [])
            .map((item) => {
              if (!item) return null;
              if (Array.isArray(ev.selectedTiffins) && !ev.selectedTiffins.includes(item.id)) {
                return null;
              }
              const hasPredefinedPrice = item.price !== undefined && parseFloat(item.price) > 0;
              const mode = (ev.pricingModes && ev.pricingModes[item.id])
                || (hasPredefinedPrice ? 'unit' : 'fixed');
              const isFixed = mode === 'fixed';

              if (isFixed) {
                const rawPrice = ev.fixedPrices && ev.fixedPrices[item.id] !== undefined
                  ? ev.fixedPrices[item.id]
                  : (hasPredefinedPrice ? item.price : 0);
                const fixedPrice = parseFloat(rawPrice) || 0;
                const isSelected = ev.fixedSelected && ev.fixedSelected[item.id] !== undefined
                  ? Boolean(ev.fixedSelected[item.id])
                  : fixedPrice > 0;

                if (!isSelected || fixedPrice <= 0) return null;

                return {
                  ...item,
                  isFixed: true,
                  qty: 1,
                  rate: fixedPrice,
                  rowTotal: fixedPrice,
                  unitDisplay: item.unit && item.unit !== 'fixed' ? item.unit : 'Total',
                };
              } else {
                const qty = (ev.tiffinQuantities && ev.tiffinQuantities[item.id]) || 0;
                const rate = parseFloat(item.price) || 0;
                if (qty <= 0) return null;

                return {
                  ...item,
                  isFixed: false,
                  qty,
                  rate,
                  rowTotal: qty * rate,
                  unitDisplay: item.unit || 'nos',
                };
              }
            })
            .filter(Boolean);

          const addedMeals = Array.isArray(ev?.addedMeals) ? ev.addedMeals : [];

          return {
            ...ev,
            index,
            orderedTiffins,
            addedMeals,
          };
        })
        .filter(Boolean)
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
      subTotal: typeof subTotal === 'number' ? subTotal.toFixed(2) : String(subTotal),
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
      const appName = (businessProfile && businessProfile.name) ? businessProfile.name : 'our app';
      await Share.share({
        message: `Invoice for ${clientName}\nSubtotal: ₹${subTotal.toFixed(2)}\nTransport Charge: ₹${transportAmount.toFixed(2)}\nTotal Amount: ₹${finalTotal.toFixed(2)}\nAdvance: ₹${advanceAmt.toFixed(2)}\nBalance Due: ₹${balanceDue.toFixed(2)}\nGenerated via ${appName}`,
      });
    } catch (error) {
      console.log(error.message);
    }
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
        const hasUnitTiffins = ev.orderedTiffins.some((item) => !item.isFixed);

        const tiffinRows = ev.orderedTiffins
          .map((item) => {
            const rowTotalDisplay = `₹${item.rowTotal.toFixed(2)}`;

            if (!hasUnitTiffins) {
              // ALL items in this table are Total Value - display only Item Description & Amount
              return `
                <tr>
                  <td><strong>${escapeHtml(item.name)}</strong></td>
                  <td style="text-align: right; font-weight: 600;">${rowTotalDisplay}</td>
                </tr>
              `;
            }

            // Mixed table (contains both unit-based and fixed items)
            if (item.isFixed) {
              return `
                <tr>
                  <td><strong>${escapeHtml(item.name)}</strong></td>
                  <td colspan="3" style="text-align: center; color: #64748b; font-size: 0.88em; font-style: italic;">Total Amount</td>
                  <td style="text-align: right; font-weight: 600;">${rowTotalDisplay}</td>
                </tr>
              `;
            }

            return `
              <tr>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>${escapeHtml(item.unit || 'nos')}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">₹${item.rate.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 600;">${rowTotalDisplay}</td>
              </tr>
            `;
          })
          .join('');

        const hasUnitMeals = ev.addedMeals.some((m) => m.pricingMode !== 'fixed');

        const mealRows = ev.addedMeals
          .map((meal) => {
            const isFixed = meal.pricingMode === 'fixed';
            const rowTotal = isFixed
              ? (parseFloat(meal.price) || 0)
              : ((parseFloat(meal.price) || 0) * (parseInt(meal.quantity, 10) || 1));
            const rowTotalDisplay = `₹${rowTotal.toFixed(2)}`;
            const dishesHtml = Array.isArray(meal.dishes) && meal.dishes.length > 0
              ? `<div style="font-size: 0.85em; color: #555; margin-top: 3px;">${escapeHtml(meal.dishes.join(', '))}</div>`
              : '';

            if (!hasUnitMeals) {
              // ALL meal packages in this table are Flat Total Value
              return `
                <tr>
                  <td>
                    <strong>${escapeHtml(meal.name)}</strong>
                    ${dishesHtml}
                  </td>
                  <td style="text-align: right; font-weight: 600;">${rowTotalDisplay}</td>
                </tr>
              `;
            }

            // Mixed meal packages table
            if (isFixed) {
              return `
                <tr>
                  <td>
                    <strong>${escapeHtml(meal.name)}</strong>
                    ${dishesHtml}
                  </td>
                  <td colspan="2" style="text-align: center; color: #64748b; font-size: 0.88em; font-style: italic;">Flat Package Total</td>
                  <td style="text-align: right; font-weight: 600;">${rowTotalDisplay}</td>
                </tr>
              `;
            }

            return `
              <tr>
                <td>
                  <strong>${escapeHtml(meal.name)}</strong>
                  ${dishesHtml}
                </td>
                <td style="text-align: center;">${meal.quantity}</td>
                <td style="text-align: right;">₹${parseFloat(meal.price || 0).toFixed(2)}</td>
                <td style="text-align: right; font-weight: 600;">${rowTotalDisplay}</td>
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
                      ${
                        hasUnitTiffins
                          ? `
                            <tr>
                              <th style="width: 42%;">Item</th>
                              <th style="width: 14%;">Unit</th>
                              <th style="width: 14%; text-align: center;">Qty</th>
                              <th style="width: 15%; text-align: right;">Rate</th>
                              <th style="width: 15%; text-align: right;">Total</th>
                            </tr>
                          `
                          : `
                            <tr>
                              <th style="width: 70%;">Item Description</th>
                              <th style="width: 30%; text-align: right;">Amount</th>
                            </tr>
                          `
                      }
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
                      ${
                        hasUnitMeals
                          ? `
                            <tr>
                              <th style="width: 50%;">Package & Dishes</th>
                              <th style="width: 15%; text-align: center;">Qty</th>
                              <th style="width: 15%; text-align: right;">Rate</th>
                              <th style="width: 20%; text-align: right;">Total</th>
                            </tr>
                          `
                          : `
                            <tr>
                              <th style="width: 70%;">Package & Dishes</th>
                              <th style="width: 30%; text-align: right;">Amount</th>
                            </tr>
                          `
                      }
                    </thead>
                    <tbody>${mealRows}</tbody>
                  </table>
                `
                : ''
            }
            ${
              parseFloat(ev.transportCharge) > 0
                ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 12px; margin-top: 5px; font-size: 0.88em;">
                    <span style="color: #475569;"><strong>Day ${ev.index + 1} Transport:</strong></span>
                    <span style="color: #1e293b; font-weight: 700;">₹${parseFloat(ev.transportCharge).toFixed(2)}</span>
                  </div>
                `
                : ''
            }
          </section>
        `;
      })
      .join('');

    const bpName = (businessProfile && businessProfile.name) || '';
    const bpTagline = (businessProfile && businessProfile.tagline) || '';
    const bpPhone = (businessProfile && businessProfile.phone) || '';
    const bpEmail = (businessProfile && businessProfile.email) || '';
    const bpAddress = (businessProfile && businessProfile.address) || '';

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4;
              margin: 12mm 14mm;
            }
            body {
              font-family: Arial, sans-serif;
              color: #1f2d3d;
            }
            body.spacious {
              font-size: 14.5px;
            }
            body.balanced {
              font-size: 12.5px;
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
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .brand-wrap {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo {
              width: 58px;
              height: 58px;
              border-radius: 12px;
              object-fit: cover;
              border: 1px solid #d9e8f0;
            }
            .brand {
              font-size: 1.85em;
              font-weight: 700;
              color: #1f3c58;
            }
            .sub {
              color: #6b7c8c;
              margin-top: 3px;
            }
            .contact {
              margin-top: 8px;
              font-size: 0.9em;
              color: #4f6272;
              line-height: 1.5;
            }
            .badge {
              background: #eef6fb;
              color: #3498db;
              padding: 6px 12px;
              border-radius: 8px;
              font-weight: 700;
              white-space: nowrap;
            }
            .meta {
              margin-bottom: 12px;
              line-height: 1.5;
              font-size: 0.95em;
            }
            .event-block {
              margin-bottom: 12px;
              page-break-inside: avoid;
            }
            h2 {
              font-size: 1.15em;
              color: #2980b9;
              margin: 6px 0;
            }
            h3 {
              font-size: 0.95em;
              color: #4f6272;
              margin: 6px 0 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 6px;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
            }
            th, td {
              border: 1px solid #d8e3ea;
              padding: 0.5em 0.75em;
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
              margin-top: 14px;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 6px;
              page-break-inside: avoid;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              width: 250px;
              font-size: 1em;
              color: #4f6272;
            }
            .grand-total-box {
              background: #f4fbf6;
              border: 1px solid #bfe6ca;
              border-radius: 10px;
              padding: 10px 14px;
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
                ${logoDataUri ? `<img src="${logoDataUri}" alt="${escapeHtml(bpName)} logo" class="logo" />` : ''}
                <div>
                  <div class="brand">${escapeHtml(bpName)}</div>
                  <div class="sub">${escapeHtml(bpTagline)}</div>
                </div>
              </div>
              <div class="contact">
                <div><strong>Phone:</strong> ${escapeHtml(bpPhone)}</div>
                <div><strong>Email:</strong> ${escapeHtml(bpEmail)}</div>
                <div><strong>Address:</strong> ${escapeHtml(bpAddress)}</div>
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

            ${
              dayTransportList.length > 1
                ? dayTransportList
                    .map(
                      (dt) => `
                        <div class="total-row" style="font-size: 0.9em; color: #64748b;">
                          <span>Day ${dt.day} Transport:</span>
                          <span>₹${dt.amount.toFixed(2)}</span>
                        </div>
                      `
                    )
                    .join('')
                : ''
            }

            <div class="total-row">
              <span>${dayTransportList.length > 1 ? 'Total Transport:' : 'Transport Charge:'}</span>
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

  const generatePdfFile = async () => {
    const logoDataUri = await getLogoDataUri();
    const html = buildInvoiceHtml(logoDataUri);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const safeClientName = (clientName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
    const targetFilename = `Invoice_${safeClientName}_${Date.now()}.pdf`;
    const targetUri = `${FileSystem.cacheDirectory}${targetFilename}`;

    await FileSystem.copyAsync({
      from: uri,
      to: targetUri,
    });

    return targetUri;
  };

  const onWhatsAppShare = async () => {
    try {
      setIsSharingWhatsApp(true);

      if (Platform.OS === 'web') {
        const logoDataUri = await getLogoDataUri();
        const html = buildInvoiceHtml(logoDataUri);
        await Print.printAsync({ html });
        return;
      }

      const pdfUri = await generatePdfFile();
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Invoice PDF with ${clientName || 'Customer'} (Choose WhatsApp)`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Share Error', 'Document sharing is not available on this device.');
      }
    } catch (error) {
      console.log('WhatsApp PDF Share error:', error);
      Alert.alert('Sharing Error', 'Unable to generate PDF for WhatsApp sharing.');
    } finally {
      setIsSharingWhatsApp(false);
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

      {/* SAVED TO HISTORY STATUS BADGE */}
      <View style={styles.savedBanner}>
        <Ionicons name="checkmark-circle" size={15} color="#10B981" />
        <Text style={styles.savedBannerText}>
          Saved to Records • Recorded in History
        </Text>
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
              const isFixed = item.isFixed;
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.itemNameText, dynamicStyles.itemName]}>{item.name}</Text>
                      {isFixed && (
                        <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: isDarkMode ? '#94A3B8' : '#64748B' }}>TOTAL AMOUNT</Text>
                        </View>
                      )}
                    </View>
                    {!isFixed && (
                      <Text style={[styles.itemSubDetail, dynamicStyles.itemDetail]}>
                        {item.qty} {item.unit || 'nos'} x ₹{item.rate.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.priceText, dynamicStyles.price]}>₹{item.rowTotal.toFixed(2)}</Text>
                </View>
              );
            })}

            {ev.addedMeals.map((meal) => {
              const isFixed = meal.pricingMode === 'fixed';
              const rowTotal = isFixed
                ? (parseFloat(meal.price) || 0)
                : ((parseFloat(meal.price) || 0) * (parseInt(meal.quantity, 10) || 1));

              return (
                <View key={meal.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.itemNameText, dynamicStyles.itemName]}>{meal.name}</Text>
                      {isFixed && (
                        <View style={{ backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: isDarkMode ? '#A5B4FC' : '#4F46E5' }}>LUMP SUM</Text>
                        </View>
                      )}
                    </View>
                    {Array.isArray(meal.dishes) && meal.dishes.length > 0 && (
                      <Text style={[styles.dishListText, dynamicStyles.itemDetail]}>
                        {meal.dishes.join(' | ')}
                      </Text>
                    )}
                    <Text style={[styles.itemSubDetail, dynamicStyles.itemDetail]}>
                      {isFixed
                        ? (meal.quantity > 1 ? `Flat Package (~${meal.quantity} guests)` : 'Flat Package Total')
                        : `${meal.quantity} plates x ₹${meal.price}`}
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

          {dayTransportList.length > 1 ? (
            <>
              {dayTransportList.map((dt, idx) => (
                <View key={idx} style={styles.totalRowSub}>
                  <Text style={[styles.totalLabelSub, { color: theme.textSecondary, fontSize: 13 }]}>
                    Day {dt.day} Transport
                  </Text>
                  <Text style={styles.totalAmountSub}>₹{dt.amount.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.totalRowSub}>
                <Text style={[styles.totalLabelSub, { fontWeight: '700' }]}>Total Transport Charges</Text>
                <Text style={[styles.totalAmountSub, { fontWeight: '700' }]}>₹{transportAmount.toFixed(2)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRowSub}>
              <Text style={styles.totalLabelSub}>Transport Charge</Text>
              <Text style={styles.totalAmountSub}>₹{transportAmount.toFixed(2)}</Text>
            </View>
          )}
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
          disabled={isExportingPdf || isSharingWhatsApp}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#25D366', '#128C7E']} style={styles.secondaryGradient}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.secondaryActionText}>
              {isSharingWhatsApp ? ' PREPARING PDF...' : ' SHARE PDF VIA WHATSAPP'}
            </Text>
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
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  savedBannerText: {
    color: isDarkMode ? '#34D399' : '#065F46',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  invoicePaper: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    borderRadius: 22,
    paddingHorizontal: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDarkMode ? 0.35 : 0.08,
    shadowRadius: 18,
  },
  invoicePaperContent: { paddingVertical: 24, paddingBottom: 60 },
  invoicePaperSpacious: { paddingHorizontal: 24 },
  invoicePaperCompact: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  headerLeft: { flex: 1, paddingRight: 16 },
  companyName: { fontSize: 22, fontWeight: '900', color: theme.text, letterSpacing: -0.4 },
  companyNameSpacious: { fontSize: 26 },
  companyNameCompact: { fontSize: 20 },
  invoiceSubtitle: { fontSize: 12, color: theme.textSecondary, fontWeight: '600', marginTop: 3 },
  contactText: { fontSize: 12, color: theme.textSecondary, marginTop: 3 },
  invoiceBadge: { backgroundColor: theme.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  invoiceBadgeText: { fontSize: 11, fontWeight: '800', color: theme.primary },
  billToSection: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: theme.textMuted, marginBottom: 4, letterSpacing: 0.8 },
  clientNameText: { fontSize: 20, fontWeight: '900', color: theme.text, letterSpacing: -0.3 },
  clientNameSpacious: { fontSize: 24 },
  clientNameCompact: { fontSize: 18 },
  dateText: { fontSize: 13, color: theme.textSecondary, marginTop: 2, fontWeight: '500' },
  divider: { height: 1, backgroundColor: theme.border, marginBottom: 20 },
  eventSection: { marginBottom: 25 },
  dayHeader: {
    backgroundColor: theme.inputBackground,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    paddingLeft: 12,
    marginBottom: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayHeaderSpacious: { paddingVertical: 8 },
  dayHeaderCompact: { marginBottom: 10 },
  dayHeaderText: { fontSize: 13, fontWeight: '800', color: theme.text, letterSpacing: 0.3 },
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
  fixedBadge: {
    backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDarkMode ? '#059669' : '#A7F3D0',
  },
  fixedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    textTransform: 'uppercase',
  },
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  secondaryActionText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },
});
