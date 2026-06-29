package bean;

import java.util.Date;

public class Notification {
    private int id;
    private String title;
    private String content;
    private String notifyType;
    private String targetType;
    private int targetId;
    private String targetName;
    private int senderId;
    private String senderName;
    private String sendChannel;
    private int isRead;
    private Date readTime;
    private Date expireTime;
    private Date createTime;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getNotifyType() { return notifyType; }
    public void setNotifyType(String notifyType) { this.notifyType = notifyType; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public int getTargetId() { return targetId; }
    public void setTargetId(int targetId) { this.targetId = targetId; }
    public String getTargetName() { return targetName; }
    public void setTargetName(String targetName) { this.targetName = targetName; }
    public int getSenderId() { return senderId; }
    public void setSenderId(int senderId) { this.senderId = senderId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getSendChannel() { return sendChannel; }
    public void setSendChannel(String sendChannel) { this.sendChannel = sendChannel; }
    public int getIsRead() { return isRead; }
    public void setIsRead(int isRead) { this.isRead = isRead; }
    public Date getReadTime() { return readTime; }
    public void setReadTime(Date readTime) { this.readTime = readTime; }
    public Date getExpireTime() { return expireTime; }
    public void setExpireTime(Date expireTime) { this.expireTime = expireTime; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
