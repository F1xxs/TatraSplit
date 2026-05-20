import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { normalizeList } from "@/lib/normalize";

export function useContacts() {
  return useQuery({
    queryKey: qk.contacts,
    queryFn: async () => normalizeList((await api.get("/contacts")).data),
  });
}
