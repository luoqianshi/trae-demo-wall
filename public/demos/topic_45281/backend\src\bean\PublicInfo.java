package bean;

import java.util.Date;

public class PublicInfo {
    private int id;
    private String title;
    private String category;
    private String content;
    private String summary;
    private String coverImage;
    private String author;
    private int viewCount;
    private int isTop;
    private int isPublished;
    private Date publishTime;
    private Date createTime;
    private Date updateTime;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public int getViewCount() { return viewCount; }
    public void setViewCount(int viewCount) { this.viewCount = viewCount; }
    public int getIsTop() { return isTop; }
    public void setIsTop(int isTop) { this.isTop = isTop; }
    public int getIsPublished() { return isPublished; }
    public void setIsPublished(int isPublished) { this.isPublished = isPublished; }
    public Date getPublishTime() { return publishTime; }
    public void setPublishTime(Date publishTime) { this.publishTime = publishTime; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
}
