package com.ice.template.integration.llm;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenAiChatMessage implements Serializable {

    private String role;

    private String content;

    private static final long serialVersionUID = 1L;
}
