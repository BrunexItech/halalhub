import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { willService, pdfService } from '../../api/client';

const Wills = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [willData, setWillData] = useState({
    fullName: '',
    idNumber: '',
    executorName: '',
    executorPhone: '',
    executorEmail: '',
    assets: '',
    bequests: [{ name: '', relation: '', amount: 0 }],
    witnesses: [
      { name: '', idNumber: '', phone: '' },
      { name: '', idNumber: '', phone: '' },
    ],
    specialInstructions: '',
    dateCreated: new Date().toISOString().split('T')[0],
  });

  const [heirs, setHeirs] = useState([
    { relation: 'Wife', name: '', share: '1/8', shareDecimal: 0.125 },
    { relation: 'Son', name: '', share: 'Asabah', shareDecimal: 0.5 },
    { relation: 'Daughter', name: '', share: 'Asabah / 2', shareDecimal: 0.25 },
  ]);

  const [willsHistory, setWillsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [estateValue, setEstateValue] = useState(5000000);
  const [inheritanceResult, setInheritanceResult] = useState<any>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchWillsHistory();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      setWillData((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        executorName: user.fullName || '',
      }));
    }
  }, [user]);

  const fetchWillsHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await willService.getWills();
      if (res.data.success) {
        setWillsHistory(res.data.wills || []);
      }
    } catch (err) {
      console.log('History error:', err);
      setWillsHistory([]);
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWillsHistory();
  };

  const fetchWillById = async (id: string) => {
    try {
      const res = await willService.getWillById(id);
      if (res.data.success) {
        const will = res.data.will;
        setWillData({
          fullName: will.fullName || '',
          idNumber: will.idNumber || '',
          executorName: will.executorName || '',
          executorPhone: will.executorPhone || '',
          executorEmail: will.executorEmail || '',
          assets: will.assets || '',
          bequests: will.bequests || [{ name: '', relation: '', amount: 0 }],
          witnesses: will.witnesses || [
            { name: '', idNumber: '', phone: '' },
            { name: '', idNumber: '', phone: '' },
          ],
          specialInstructions: will.specialInstructions || '',
          dateCreated: will.createdAt ? will.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        });
        if (will.heirs && will.heirs.length > 0) {
          setHeirs(will.heirs);
        }
        setSuccess('Will loaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to load will');
      setTimeout(() => setError(''), 3000);
    }
  };

  const addHeir = () => {
    setHeirs([...heirs, { relation: '', name: '', share: '', shareDecimal: 0 }]);
  };

  const removeHeir = (index: number) => {
    if (heirs.length <= 1) {
      setError('You must have at least one heir');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setHeirs(heirs.filter((_, i) => i !== index));
  };

  const updateHeir = (index: number, field: string, value: string) => {
    const updated = [...heirs];
    updated[index] = { ...updated[index], [field]: value };
    setHeirs(updated);
  };

  const addBequest = () => {
    setWillData({
      ...willData,
      bequests: [...willData.bequests, { name: '', relation: '', amount: 0 }],
    });
  };

  const removeBequest = (index: number) => {
    if (willData.bequests.length <= 1) {
      setError('You must have at least one bequest');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const updated = [...willData.bequests];
    updated.splice(index, 1);
    setWillData({ ...willData, bequests: updated });
  };

  const updateBequest = (index: number, field: string, value: string | number) => {
    const updated = [...willData.bequests];
    updated[index] = { ...updated[index], [field]: value };
    setWillData({ ...willData, bequests: updated });
  };

  const updateWitness = (index: number, field: string, value: string) => {
    const updated = [...willData.witnesses];
    updated[index] = { ...updated[index], [field]: value };
    setWillData({ ...willData, witnesses: updated });
  };

  const handleWillChange = (field: string, value: string) => {
    setWillData({ ...willData, [field]: value });
    setError('');
  };

  const saveWill = () => {
    if (!willData.fullName) {
      setError('Please enter your full name');
      return;
    }
    if (!willData.executorName) {
      setError('Please enter the executor name');
      return;
    }
    if (!willData.assets) {
      setError('Please list your assets');
      return;
    }
    if (willData.witnesses.some((w) => !w.name)) {
      setError('Please enter all witness names');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSaveWill = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await willService.createWill({
        fullName: willData.fullName,
        idNumber: willData.idNumber,
        executorName: willData.executorName,
        executorPhone: willData.executorPhone,
        executorEmail: willData.executorEmail,
        assets: willData.assets,
        bequests: willData.bequests.filter((b) => b.name),
        heirs: heirs.filter((h) => h.relation || h.name),
        witnesses: willData.witnesses,
        specialInstructions: willData.specialInstructions,
        status: 'draft',
      });

      if (response.data.success) {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        await fetchWillsHistory();
        setSuccess('Will created and encrypted successfully');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save will. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const calculateInheritance = async () => {
    setProcessing(true);
    try {
      const response = await willService.calculateInheritance({
        estate: estateValue,
        heirs: heirs,
      });
      if (response.data.success) {
        setInheritanceResult(response.data.data);
        setSuccess('Inheritance calculated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to calculate inheritance');
    } finally {
      setProcessing(false);
    }
  };

  const generatePDF = async () => {
    setProcessing(true);
    try {
      const response = await pdfService.generateWill({
        fullName: willData.fullName,
        idNumber: willData.idNumber,
        executorName: willData.executorName,
        executorPhone: willData.executorPhone,
        executorEmail: willData.executorEmail,
        assets: willData.assets,
        bequests: willData.bequests,
        heirs: heirs,
        witnesses: willData.witnesses,
        specialInstructions: willData.specialInstructions,
      });
      setSuccess('PDF generated successfully');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* Hero Section */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Digital Wasiyyah
                </Text>
                <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>Islamic Will</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Create Your Islamic Will</Text>
              <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 6, maxWidth: 400, lineHeight: 20 }}>
                A guided process to create your Wasiyyah. Secure, Sharia-compliant, and professionally structured.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>Sharia Compliant</Text>
                </View>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Encrypted</Text>
                </View>
              </View>
            </View>
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {/* Form - Left */}
            <View style={{ flex: 2, minWidth: 300, gap: 12 }}>
              {/* Personal Information */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Personal Information</Text>
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Full Legal Name</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={willData.fullName}
                    onChangeText={(text) => handleWillChange('fullName', text)}
                    placeholder="As per National ID"
                  />
                </View>
                <View>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>ID Number</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={willData.idNumber}
                    onChangeText={(text) => handleWillChange('idNumber', text)}
                    placeholder="National ID / Passport"
                  />
                </View>
              </View>

              {/* Executor */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Executor (Wasi)</Text>
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Executor Name</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={willData.executorName}
                    onChangeText={(text) => handleWillChange('executorName', text)}
                    placeholder="Name of trusted executor"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Phone</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        color: '#1F2937',
                        fontSize: 14,
                      }}
                      value={willData.executorPhone}
                      onChangeText={(text) => handleWillChange('executorPhone', text)}
                      placeholder="+2547XXXXXXXX"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Email</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        color: '#1F2937',
                        fontSize: 14,
                      }}
                      value={willData.executorEmail}
                      onChangeText={(text) => handleWillChange('executorEmail', text)}
                      placeholder="executor@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>

              {/* Assets */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Assets</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>List Your Assets</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  value={willData.assets}
                  onChangeText={(text) => handleWillChange('assets', text)}
                  placeholder="Bank accounts, property, business interests, vehicles, investments, digital assets, personal valuables..."
                  multiline
                />
              </View>

              {/* Bequests */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Bequests</Text>
                  <TouchableOpacity onPress={addBequest}>
                    <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '500' }}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 10 }}>Bequests cannot exceed 1/3 of your estate</Text>

                {willData.bequests.map((bequest, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#FAFAF7',
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    marginBottom: 8,
                    flexWrap: 'wrap',
                  }}>
                    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 80,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={bequest.name}
                        onChangeText={(text) => updateBequest(index, 'name', text)}
                        placeholder="Name"
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 80,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={bequest.relation}
                        onChangeText={(text) => updateBequest(index, 'relation', text)}
                        placeholder="Relation"
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 80,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={String(bequest.amount)}
                        onChangeText={(text) => updateBequest(index, 'amount', parseFloat(text) || 0)}
                        placeholder="Amount"
                        keyboardType="numeric"
                      />
                    </View>
                    <TouchableOpacity onPress={() => removeBequest(index)}>
                      <Text style={{ color: '#DC2626', fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Witnesses */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Witnesses</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Two witnesses required</Text>
                </View>

                {willData.witnesses.map((witness, index) => (
                  <View key={index} style={{
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    marginBottom: 10,
                  }}>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                      Witness {index + 1}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 80,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={witness.name}
                        onChangeText={(text) => updateWitness(index, 'name', text)}
                        placeholder="Full Name *"
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 70,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={witness.idNumber}
                        onChangeText={(text) => updateWitness(index, 'idNumber', text)}
                        placeholder="ID Number"
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 70,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={witness.phone}
                        onChangeText={(text) => updateWitness(index, 'phone', text)}
                        placeholder="Phone"
                      />
                    </View>
                  </View>
                ))}
              </View>

              {/* Special Instructions */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Special Instructions</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 60,
                    textAlignVertical: 'top',
                  }}
                  value={willData.specialInstructions}
                  onChangeText={(text) => handleWillChange('specialInstructions', text)}
                  placeholder="Any special instructions or wishes..."
                  multiline
                />
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#0B342B',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={saveWill}
                  disabled={processing}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                    {processing ? 'Saving...' : 'Save & Encrypt Will'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}
                  onPress={generatePDF}
                  disabled={processing}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>
                    {processing ? 'Generating...' : 'Download PDF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sidebar - Right */}
            <View style={{ flex: 1, minWidth: 200, gap: 12 }}>
              {/* Islamic Guidance */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Islamic Guidance</Text>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 8,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    "And whoever leaves behind a will, it shall be carried out after any debts." — Quran 2:180
                  </Text>
                </View>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 8,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    "Verily, Allah has given to each person their rightful share." — Hadith
                  </Text>
                </View>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>What is a Wasiyyah?</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 18 }}>
                    A Wasiyyah (Islamic will) allows you to allocate up to 1/3 of your estate
                    to non-heirs, while the remaining 2/3 is distributed according to
                    Faraidh (Islamic inheritance law).
                  </Text>
                </View>
              </View>

              {/* Faraidh Calculator */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Faraidh Calculator</Text>
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Estate Value (KES)</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={String(estateValue)}
                    onChangeText={(text) => setEstateValue(parseFloat(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>Heirs</Text>
                  <TouchableOpacity onPress={addHeir}>
                    <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '500' }}>+ Add Heir</Text>
                  </TouchableOpacity>
                </View>

                {heirs.map((heir, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#FAFAF7',
                    padding: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    marginBottom: 6,
                    flexWrap: 'wrap',
                  }}>
                    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 60,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 4,
                          color: '#1F2937',
                          fontSize: 13,
                        }}
                        value={heir.relation}
                        onChangeText={(text) => updateHeir(index, 'relation', text)}
                        placeholder="Relation"
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 60,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 4,
                          color: '#1F2937',
                          fontSize: 13,
                        }}
                        value={heir.name}
                        onChangeText={(text) => updateHeir(index, 'name', text)}
                        placeholder="Name"
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          minWidth: 50,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 4,
                          color: '#1F2937',
                          fontSize: 13,
                        }}
                        value={heir.share}
                        onChangeText={(text) => updateHeir(index, 'share', text)}
                        placeholder="Share"
                      />
                    </View>
                    <TouchableOpacity onPress={() => removeHeir(index)}>
                      <Text style={{ color: '#DC2626', fontSize: 14 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={{
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 8,
                    opacity: processing ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={calculateInheritance}
                  disabled={processing}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                    {processing ? 'Calculating...' : 'Calculate Inheritance'}
                  </Text>
                </TouchableOpacity>

                {inheritanceResult && (
                  <View style={{
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    marginTop: 10,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Distribution</Text>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                        Total: {formatCurrency(inheritanceResult.estate)}
                      </Text>
                    </View>
                    {inheritanceResult.distribution.map((item: any, index: number) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 4,
                        borderBottomWidth: index < inheritanceResult.distribution.length - 1 ? 1 : 0,
                        borderBottomColor: '#E8EEF4',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>
                          {item.relation}: {item.name}
                        </Text>
                        <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }}>
                          {item.share} — {formatCurrency(item.amount)}
                        </Text>
                      </View>
                    ))}
                    {inheritanceResult.remaining > 0 && (
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingTop: 6,
                        marginTop: 4,
                        borderTopWidth: 1,
                        borderTopColor: '#E8EEF4',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>Remaining (Asabah)</Text>
                        <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '600' }}>
                          {formatCurrency(inheritanceResult.remaining)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Previous Wills */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Previous Wills</Text>
                  <TouchableOpacity onPress={fetchWillsHistory}>
                    <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                {loadingHistory ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color="#C9A44B" />
                  </View>
                ) : willsHistory.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>No previous wills</Text>
                    <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Create your first will</Text>
                  </View>
                ) : (
                  willsHistory.slice(0, 5).map((will) => (
                    <TouchableOpacity
                      key={will.id}
                      style={{
                        backgroundColor: '#FAFAF7',
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        marginBottom: 6,
                      }}
                      onPress={() => fetchWillById(will.id)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>
                            {will.fullName || will.version}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(will.date)}</Text>
                          {will.reference && (
                            <Text style={{ color: '#6B7280', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                              Ref: {will.reference}
                            </Text>
                          )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={{
                            backgroundColor: will.status === 'active' ? '#D1FAE5' :
                                          will.status === 'completed' ? '#DBEAFE' :
                                          '#FEF3C7',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: will.status === 'active' ? '#A7F3D0' :
                                          will.status === 'completed' ? '#BFDBFE' :
                                          '#FDE68A',
                          }}>
                            <Text style={{
                              color: will.status === 'active' ? '#3FAF73' :
                                     will.status === 'completed' ? '#3B82F6' :
                                     '#D97706',
                              fontSize: 11,
                              fontWeight: '500',
                            }}>
                              {will.status === 'active' ? 'Active' :
                               will.status === 'completed' ? 'Completed' : 'Draft'}
                            </Text>
                          </View>
                          <Text style={{ color: '#6B7280', fontSize: 12 }}>v{will.version || '1'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Confirm Will</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 40, marginBottom: 6 }}>📜</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Save Your Islamic Will</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Your will will be encrypted and stored securely.</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Executor</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{willData.executorName}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Bequests</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {willData.bequests.filter((b) => b.name).length}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Heirs</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {heirs.filter((h) => h.relation || h.name).length}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Witnesses</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {willData.witnesses.filter((w) => w.name).length}/2
                  </Text>
                </View>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: processing ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={confirmSaveWill}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Saving...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Save Will</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#0B342B',
              padding: 16,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              margin: -20,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Will Saved</Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(11, 52, 43, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(11, 52, 43, 0.2)',
                }}>
                  <Text style={{ color: '#0B342B', fontSize: 32 }}>✓</Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>Your Islamic Will has been created</Text>
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700', marginTop: 2 }}>Successfully Saved</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                  Your will is encrypted and stored securely. Share the downloaded file with your lawyer and executor.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#0B342B',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginBottom: 10,
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={generatePDF}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Download PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#F4F5F1',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Toast */}
      {success ? (
        <View style={{
          position: 'absolute',
          top: 60,
          right: 16,
          left: 16,
          backgroundColor: '#0B342B',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#0B342B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#C9A44B', fontSize: 16 }}>✓</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Wills;