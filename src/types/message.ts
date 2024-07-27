export default interface Message {
  channelId: string,
  message: string | undefined,
  embeds: {
    author: {
      name: string | undefined,
      url: string | undefined,
      icon_url: string | undefined,
    },
    body: {
      title: string | undefined,
      description: string | undefined,
      url: string | undefined,
      color: string | undefined,
    },
    images: {
      image_url: string | undefined,
      thumbnail_url: string | undefined,
    },
    footer: {
      text: string | undefined,
      icon_url: string | undefined,
      timestamp: string | undefined,
    },
    fields: {
      name: string,
      inline: boolean,
      value: string,
    }[]
  }[]
  attachments: string[];
}

