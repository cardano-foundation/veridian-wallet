const isValidHttpUrl = (urlString: string) => {
  const urlPattern =
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9](\.|(:\d*))?([^\s]{2,})?|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;

  const defaultPortPattern =
    /https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9](\.|(:\d*))?([^\s]{0,})/;
  const ipPattern = /^((https?:\/\/)|(www.))(\d+\.\d+\.\d+\.\d+)(:\d{1,5})?$/;

  return (
    !!urlPattern.test(urlString) ||
    ipPattern.test(urlString) ||
    defaultPortPattern.test(urlString)
  );
};

const isValidConnectionUrl = (url: string) => {
  const pattern =
    /https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+([\w])?(\.|(:\d*))?([^\s]{0,})\/oobi\/([\w-]+)\/(?:agent|mailbox|witness)\/([\w-]+)(?:\?name=[\w]+)?|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+([\w])?(\.|(:\d*))?([^\s]{0,})\/oobi\/([\w-]+)\/controller(?:\?name=[\w]+)?/;

  return pattern.test(url);
};

export { isValidHttpUrl, isValidConnectionUrl };
