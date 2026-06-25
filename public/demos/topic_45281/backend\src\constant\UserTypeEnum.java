package constant;

public enum UserTypeEnum {
    DOCTOR("DOCTOR"),
    PATIENT("PATIENT"),
    ADMIN("ADMIN");

    private final String value;

    UserTypeEnum(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static UserTypeEnum fromValue(String value) {
        for (UserTypeEnum type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return null;
    }
}