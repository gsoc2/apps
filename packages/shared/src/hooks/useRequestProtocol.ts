import { useMemo } from 'react';
import request, { RequestDocument, Variables } from 'graphql-request';
import { useQueryClient } from 'react-query';
import { RequestProtocol, REQUEST_PROTOCOL_KEY } from '../graphql/common';
import { commonRequestHeaders } from '../lib/headers';

export const useRequestProtocol = (): RequestProtocol => {
  const client = useQueryClient();
  const { requestMethod, fetchMethod, isCompanion } =
    client.getQueryData<RequestProtocol>(REQUEST_PROTOCOL_KEY) || {};

  return useMemo(() => {
    const requester = requestMethod || request;
    const fetcher = fetchMethod || fetch;

    return {
      requestMethod: <T extends unknown, V extends Variables>(
        url: string,
        document: RequestDocument,
        variables?: V,
        requestHeaders?: HeadersInit,
      ): Promise<T> =>
        requester(url, document, variables, {
          ...requestHeaders,
          ...commonRequestHeaders,
        }),

      fetchMethod: (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> =>
        fetcher(input, {
          ...init,
          headers: { ...init?.headers, ...commonRequestHeaders },
        }),

      isCompanion,
    };
  }, [requestMethod, fetchMethod, isCompanion]);
};
