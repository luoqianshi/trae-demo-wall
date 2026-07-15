import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { violationRecords, deviceList, dogIcons } from '@/data/mockData';
import type { ViolationRecord, DeviceInfo } from '@/types';

const IndexPage = () => {
  const [currentDevice, setCurrentDevice] = useState(deviceList[0]);
  const [currentRecord, setCurrentRecord] = useState<ViolationRecord | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredRecords, setFilteredRecords] = useState(violationRecords);
  const [liveTime, setLiveTime] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [disposalRemark, setDisposalRemark] = useState('');
  const [disposalResult, setDisposalResult] = useState<string>('');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setLiveTime(`${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setFilteredRecords(violationRecords);
  }, []);

  const searchRecords = () => {
    if (!searchKeyword.trim()) {
      setFilteredRecords(violationRecords);
      return;
    }
    const filtered = violationRecords.filter(item =>
      item.phone.includes(searchKeyword) || item.location.includes(searchKeyword)
    );
    setFilteredRecords(filtered);
  };

  const showDetail = (record: ViolationRecord) => {
    setCurrentRecord(record);
    setHasPhoto(false);
    setSelectedOption('');
    setDisposalRemark('');
    setDisposalResult('');
    setIsDetailVisible(true);
  };

  const hideDetail = () => {
    setIsDetailVisible(false);
    setSelectedOption('');
    setDisposalRemark('');
  };

  const selectDevice = (device: typeof deviceList[0]) => {
    setCurrentDevice(device);
    const relatedRecord = violationRecords.find(r => r.location === device.name);
    if (relatedRecord) {
      setCurrentRecord(relatedRecord);
    }
    showToast(`已切换至 ${device.name}`);
  };

  const openAmap = () => {
    const { lat, lng, name } = currentDevice;
    let url = '';
    if (process.env.TARO_ENV === 'weapp') {
      url = `iosamap://navi?sourceApplication=养犬预警&poiname=${encodeURIComponent(name)}&lat=${lat}&lon=${lng}&dev=0`;
    } else {
      url = `https://uri.amap.com/navigation?from=&to=${name}&lat=${lat}&lon=${lng}&mode=car&policy=1`;
    }
    showToast('正在打开高德地图...');
    Taro.setClipboardData({
      data: `${name}: ${lat},${lng}`,
      success: () => {
        Taro.showToast({ title: '位置信息已复制', icon: 'none' });
      }
    });
  };

  const selectOption = (result: string) => {
    setSelectedOption(result);
  };

  const takePhoto = () => {
    setHasPhoto(true);
    showToast('拍照留证成功');
  };

  const submitDisposal = () => {
    if (!selectedOption) {
      showToast('请选择处置结果');
      return;
    }

    const resultText = selectedOption;
    const result = `
      <view style="font-weight: 600; margin-bottom: 8rpx;">✅ 已处置</view>
      <view style="margin-bottom: 8rpx;">结果：${resultText}</view>
      ${hasPhoto ? '<view style="margin-bottom: 8rpx;">📷 已拍照留证</view>' : ''}
      ${disposalRemark ? `<view>备注：${disposalRemark}</view>` : ''}
      <view style="font-size: ${styles.fontSizeXs}; opacity: 0.5; margin-top: 12rpx;">处置时间：${new Date().toLocaleString()}</view>
    `;
    setDisposalResult(result);
    showToast('处置记录已提交');

    setTimeout(() => {
      hideDetail();
    }, 1500);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2000);
  };

  const getLevelClass = (level: string) => {
    if (level.includes('红色')) return styles.levelRed;
    if (level.includes('橙色')) return styles.levelOrange;
    return '';
  };

  const getLevelText = (level: string) => {
    return level.replace('预警', '');
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>文明养犬预警</Text>
        <View className={styles.headerStatus}>
          <View className={styles.statusDot}></View>
          <Text className={styles.statusText}>监控中</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.mainContent}>
        <View className={styles.videoSection}>
          <View className={styles.videoFeed}>
            <View className={styles.videoContent}>
              <Text className={styles.videoIcon}>📹</Text>
              <Text className={styles.videoText}>{currentDevice.name}监控画面</Text>
            </View>
          </View>
          <Text className={styles.cameraInfo}>📷 {currentDevice.name} | {currentDevice.cameraId}</Text>
          {currentDevice.status === 'alarm' && (
            <>
              <View className={styles.detectionBox} style={{ top: '25%', left: '20%', width: '200rpx', height: '240rpx' }}>
                <Text className={styles.detectionLabel}>{currentDevice.sizeClass === 'large' ? '大型犬' : currentDevice.sizeClass === 'medium' ? '中型犬' : '小型犬'} · 未牵绳</Text>
              </View>
              <Text className={styles.alertBadge}>⚠️ 违规预警</Text>
            </>
          )}
        </View>

        <View className={styles.bottomRow}>
          <View className={styles.leftPanel}>
            <View className={styles.panelHeader}>
              <Text className={styles.panelTitle}>📋 违规记录</Text>
              <Text className={styles.panelAction}>查看全部</Text>
            </View>
            <View className={styles.searchBox}>
              <Input
                className={styles.searchInput}
                placeholder="输入手机号查询"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.detail.value)}
                onConfirm={searchRecords}
              />
              <Button className={styles.searchBtn} onClick={searchRecords}>查询</Button>
            </View>
            <ScrollView scrollY className={styles.recordList}>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <View
                    key={record.id}
                    className={styles.recordItem}
                    onClick={() => showDetail(record)}
                  >
                    <Text className={styles.recordPhone}>{record.phone}</Text>
                    <View className={styles.recordInfo}>
                      <Text>{record.size} · {record.location}</Text>
                      <Text className={`${styles.recordLevel} ${getLevelClass(record.level)}`}>
                        {getLevelText(record.level)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ textAlign: 'center', padding: '40rpx', opacity: 0.5 }}>未找到相关记录</Text>
              )}
            </ScrollView>
          </View>

          <View className={styles.rightPanel}>
            <View className={styles.snapshotCard} onClick={() => currentRecord && showDetail(currentRecord)}>
              <View className={`${styles.snapshotImgBox} ${currentDevice.sizeClass}`}>
                <Text className={styles.snapshotIcon}>{dogIcons[currentDevice.sizeClass]}</Text>
                <Text>{currentDevice.name}</Text>
              </View>
              <Text className={styles.snapshotBadge}>
                {currentDevice.sizeClass === 'large' ? '大型犬' : currentDevice.sizeClass === 'medium' ? '中型犬' : '小型犬'}
              </Text>
              <Text className={styles.liveTime}>{liveTime}</Text>
            </View>

            <View className={styles.mapCard}>
              <View className={styles.communityMap}>
                <View className={styles.heatZones}>
                  <View className={styles.heatZoneHot} style={{ top: '5%', left: '25%', width: '25%', height: '15%', borderRadius: '50%' }}></View>
                  <View className={styles.heatZoneHot} style={{ top: '5%', left: '50%', width: '25%', height: '15%', borderRadius: '50%' }}></View>
                  <View className={styles.heatZoneMedium} style={{ top: '45%', left: '55%', width: '40%', height: '35%', borderRadius: '16rpx' }}></View>
                  <View className={styles.heatZoneCold} style={{ top: '30%', left: '5%', width: '15%', height: '40%', borderRadius: '8rpx' }}></View>
                  <View className={styles.heatZoneCold} style={{ top: '70%', left: '70%', width: '15%', height: '25%', borderRadius: '8rpx' }}></View>
                </View>
                <View className={styles.buildingLayout}>
                  <View className={styles.building building2} onClick={() => selectDevice(deviceList[3])}>
                    <Text className={styles.buildingText}>2号楼</Text>
                  </View>
                  <View className={styles.building building3} onClick={() => selectDevice(deviceList[0])}>
                    <Text className={styles.buildingText}>3号楼</Text>
                  </View>
                  <View className={styles.building building4} onClick={() => selectDevice(deviceList[4])}>
                    <Text className={styles.buildingText}>4号楼</Text>
                  </View>
                  <View className={styles.building building5} onClick={() => selectDevice(deviceList[1])}>
                    <Text className={styles.buildingText}>5号楼</Text>
                  </View>
                  <View className={styles.building building6} onClick={() => selectDevice(deviceList[5])}>
                    <Text className={styles.buildingText}>6号楼</Text>
                  </View>
                  <View className={styles.playground} onClick={() => selectDevice(deviceList[2])}>
                    <Text className={styles.playgroundIcon}>🏃</Text>
                    <Text className={styles.playgroundText}>儿童活动区</Text>
                  </View>
                </View>
                <View className={styles.mapMarkers}>
                  {deviceList.map((device, index) => {
                    const positions = [
                      { top: '40%', left: '50%' },
                      { top: '55%', left: '75%' },
                      { top: '12%', left: '35%' },
                      { top: '50%', left: '12%' },
                      { top: '55%', left: '60%' },
                      { top: '80%', left: '77%' },
                    ];
                    const pos = positions[index];
                    let color = '#2ed573';
                    if (device.status === 'alarm') color = '#ff4757';
                    else if (device.status === 'alert') color = '#ffa502';
                    return (
                      <View
                        key={device.id}
                        className={styles.mapMarker}
                        style={{ ...pos, background: color }}
                        onClick={() => selectDevice(device)}
                      >
                        <Text className={styles.markerText}>{device.id}</Text>
                      </View>
                    );
                  })}
                </View>
                <View className={styles.legend}>
                  <View className={styles.legendItem}>
                    <View className={styles.legendColorHot}></View>
                    <Text className={styles.legendText}>高发区</Text>
                  </View>
                  <View className={styles.legendItem}>
                    <View className={styles.legendColorMedium}></View>
                    <Text className={styles.legendText}>中发区</Text>
                  </View>
                  <View className={styles.legendItem}>
                    <View className={styles.legendColorCold}></View>
                    <Text className={styles.legendText}>低发区</Text>
                  </View>
                </View>
                <Text className={styles.mapLabel}>📍 违规热力图</Text>
              </View>
              <Button className={styles.navigateBtn} onClick={openAmap}>🚶 前往此处</Button>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className={`${styles.detailModal} ${isDetailVisible ? styles.show : ''}`}>
        <View className={styles.detailHeader}>
          <Text className={styles.backBtn} onClick={hideDetail}>←</Text>
          <Text className={styles.detailTitle}>违规详情</Text>
        </View>
        <ScrollView scrollY className={styles.detailContent}>
          {currentRecord && (
            <>
              <View className={`${styles.detailImageBox} ${currentRecord.sizeClass}`}>
                <Text className={styles.snapshotIcon}>{dogIcons[currentRecord.sizeClass]}</Text>
                <Text>{currentRecord.size}未牵绳</Text>
              </View>

              <View className={styles.detailInfoRow}>
                <Text className={styles.detailInfoLabel}>犬主电话</Text>
                <Text className={styles.detailInfoValue}>{currentRecord.phone}</Text>
              </View>
              <View className={styles.detailInfoRow}>
                <Text className={styles.detailInfoLabel}>犬只体型</Text>
                <Text className={styles.detailInfoValue}>{currentRecord.size}</Text>
              </View>
              <View className={styles.detailInfoRow}>
                <Text className={styles.detailInfoLabel}>预警等级</Text>
                <Text className={styles.detailInfoValue}>{currentRecord.level}</Text>
              </View>
              <View className={styles.detailInfoRow}>
                <Text className={styles.detailInfoLabel}>报警位置</Text>
                <Text className={styles.detailInfoValue}>{currentRecord.location}</Text>
              </View>
              <View className={styles.detailInfoRow}>
                <Text className={styles.detailInfoLabel}>报警时间</Text>
                <Text className={styles.detailInfoValue}>{currentRecord.time}</Text>
              </View>

              <View className={styles.disposalForm}>
                <Text className={styles.formTitle}>📝 处置情况</Text>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>处置结果</Text>
                  <View className={styles.formOptions}>
                    <View
                      className={`${styles.formOption} ${selectedOption === '劝导成功，犬主已牵绳' ? styles.selected : ''}`}
                      onClick={() => selectOption('劝导成功，犬主已牵绳')}
                    >
                      <View className={styles.optionRadio}></View>
                      <Text className={styles.formOptionText}>劝导成功，犬主已牵绳</Text>
                    </View>
                    <View
                      className={`${styles.formOption} ${selectedOption === '拒不配合，已上报物业' ? styles.selected : ''}`}
                      onClick={() => selectOption('拒不配合，已上报物业')}
                    >
                      <View className={styles.optionRadio}></View>
                      <Text className={styles.formOptionText}>拒不配合，已上报物业</Text>
                    </View>
                    <View
                      className={`${styles.formOption} ${selectedOption === '犬主不在场，已驱赶犬只' ? styles.selected : ''}`}
                      onClick={() => selectOption('犬主不在场，已驱赶犬只')}
                    >
                      <View className={styles.optionRadio}></View>
                      <Text className={styles.formOptionText}>犬主不在场，已驱赶犬只</Text>
                    </View>
                  </View>
                </View>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>📷 拍照留证</Text>
                  <View
                    className={`${styles.photoUploadArea} ${hasPhoto ? styles.hasPhoto : ''}`}
                    onClick={takePhoto}
                  >
                    {hasPhoto ? (
                      <View style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8rpx' }}>
                        <Text style={{ fontSize: '36rpx' }}>✅ 拍照成功</Text>
                      </View>
                    ) : (
                      <>
                        <Text className={styles.photoIcon}>📷</Text>
                        <Text className={styles.photoText}>点击拍照或上传照片</Text>
                      </>
                    )}
                  </View>
                </View>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>备注说明</Text>
                  <Input
                    className={styles.formTextarea}
                    type="textarea"
                    placeholder="请输入处置详情..."
                    value={disposalRemark}
                    onChange={(e) => setDisposalRemark(e.detail.value)}
                  />
                </View>

                <Button className={styles.submitBtn} onClick={submitDisposal}>✅ 提交处置记录</Button>
              </View>

              <View className={styles.disposalRecord}>
                {disposalResult ? (
                  <Text dangerouslySetInnerHTML={{ __html: disposalResult }}></Text>
                ) : (
                  <Text>暂无处置记录</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      <View className={`${styles.toast} ${isToastVisible ? styles.show : ''}`}>
        <Text>{toastMessage}</Text>
      </View>
    </View>
  );
};

export default IndexPage;
