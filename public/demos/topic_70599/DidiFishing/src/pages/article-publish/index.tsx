import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { articleCategories } from '../../data/common';
import { useUserStore } from '../../store/userStore';
import { publishArticle } from '../../services/api';
import styles from './index.module.scss';

const TAG_OPTIONS = ['路亚', '台钓', '海钓', '矶钓', '筏钓', '传统钓', '草鱼', '鲫鱼', '大物', '新手', '装备', '免费', '夏季', '冬季'];

const ArticlePublishPage: React.FC = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categoryItems = useMemo(
    () => articleCategories.slice(1).map((c) => c.label),
    []
  );

  const categoryValue = articleCategories[categoryIndex]?.value || 'tech';
  const categoryLabel = articleCategories[categoryIndex]?.label || '钓技';

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }
    if (!summary.trim()) {
      Taro.showToast({ title: '请填写摘要', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      Taro.showToast({ title: '请填写正文', icon: 'none' });
      return;
    }
    if (selectedTags.length === 0) {
      Taro.showToast({ title: '请至少选择一个标签', icon: 'none' });
      return;
    }

    const newArticle = {
      id: `a_user_${Date.now()}`,
      authorId: currentUser?.id || 'u_current',
      authorName: currentUser?.nickname || '我',
      authorAvatar: currentUser?.avatar || '',
      authorLevel: currentUser?.level || 1,
      authorYears: currentUser?.years || 1,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      cover: `https://picsum.photos/id/${1015 + (Date.now() % 5)}/750/500`,
      category: categoryValue as any,
      tags: selectedTags,
      location: currentUser?.location || '杭州',
      likes: 0,
      comments: 0,
      views: 0,
      liked: false,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm')
    };

    console.info('[ArticlePublish] submit:', newArticle);
    publishArticle(newArticle)
      .then(() => {
        Taro.showToast({ title: '发布成功', icon: 'success' });
        Taro.vibrateShort({ type: 'medium' });
        setTimeout(() => Taro.navigateBack(), 800);
      })
      .catch((err) => {
        console.error('[ArticlePublish] submit failed:', err);
        Taro.showToast({ title: '发布失败', icon: 'none' });
      });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tipBar}>
        <Text className={styles.tipIcon}>✍️</Text>
        <Text className={styles.tipText}>分享你的钓技、钓点或装备心得，让更多钓友受益</Text>
      </View>

      <View className={styles.card}>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>文章标题</Text>
          <Input
            className={styles.fieldInput}
            placeholder="一个吸引人的标题..."
            placeholderClass={styles.placeholder}
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={40}
          />
          <Text className={styles.fieldCounter}>{title.length}/40</Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>文章摘要</Text>
          <Textarea
            className={styles.textareaShort}
            placeholder="用 1-2 句话介绍文章亮点..."
            placeholderClass={styles.placeholder}
            value={summary}
            onInput={(e) => setSummary(e.detail.value)}
            maxlength={100}
            autoHeight
          />
          <Text className={styles.fieldCounter}>{summary.length}/100</Text>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>文章分类</Text>
          <Picker
            mode="selector"
            range={categoryItems}
            value={categoryIndex - 1}
            onChange={(e) => setCategoryIndex(Number(e.detail.value) + 1)}
          >
            <View className={styles.pickerField}>
              <Text className={styles.pickerValue}>📚 {categoryLabel}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>文章标签（可多选）</Text>
          <View className={styles.chipGrid}>
            {TAG_OPTIONS.map((t) => (
              <View
                key={t}
                className={classnames(styles.chip, selectedTags.includes(t) && styles.chipActive)}
                onClick={() => toggleTag(t)}
              >
                <Text className={classnames(styles.chipText, selectedTags.includes(t) && styles.chipTextActive)}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
          {selectedTags.length > 0 && (
            <Text className={styles.tagHint}>已选 {selectedTags.length} 个标签</Text>
          )}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>正文内容</Text>
          <Textarea
            className={styles.textareaLong}
            placeholder={
              '详细介绍你的钓技心得、钓点攻略或装备测评...\n\n提示：可以分段写，适当使用换行让阅读更轻松'
            }
            placeholderClass={styles.placeholder}
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={2000}
            autoHeight
          />
          <Text className={styles.fieldCounter}>{content.length}/2000</Text>
        </View>
      </View>

      <View className={styles.coverInfo}>
        <Text className={styles.coverInfoTitle}>📷 文章封面</Text>
        <Text className={styles.coverInfoText}>系统会随机为你生成一张封面图</Text>
      </View>

      <View className={styles.submitBar}>
        <View className={styles.submitBtn} onClick={handleSubmit}>
          <Text className={styles.submitBtnText}>发布文章</Text>
        </View>
      </View>
    </View>
  );
};

export default ArticlePublishPage;
