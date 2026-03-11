import type { StoryNode } from "../types/story";

const makeAnnouncementPlaceholder = (id: string): StoryNode => ({
  id,
  scene: "",
  lines: [],
  options: [{ text: "占位选项", followUp: { lines: [] } }],
});

export const announcementStories: Record<string, StoryNode> = {
  shen_mo_announcement: makeAnnouncementPlaceholder("shen_mo_announcement"),
  lu_xingran_announcement: makeAnnouncementPlaceholder("lu_xingran_announcement"),
  liu_mengyao_announcement: makeAnnouncementPlaceholder("liu_mengyao_announcement"),
  su_tangtang_announcement: makeAnnouncementPlaceholder("su_tangtang_announcement"),
  gu_chengyan_announcement: makeAnnouncementPlaceholder("gu_chengyan_announcement"),
  lin_yu_announcement: makeAnnouncementPlaceholder("lin_yu_announcement"),
  zhou_yan_announcement: makeAnnouncementPlaceholder("zhou_yan_announcement"),
  jiang_muci_announcement: makeAnnouncementPlaceholder("jiang_muci_announcement"),
  ji_mingxuan_announcement: makeAnnouncementPlaceholder("ji_mingxuan_announcement"),
};
