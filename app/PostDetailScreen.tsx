import { Button, Linking, StyleSheet, Text, View } from "react-native";

export default function PostDetailScreen({ route }: any) {
  const { post } = route.params;

  const handleContact = () => {
    if (!post.userEmail) return;
    const subject = encodeURIComponent(`Regarding: ${post.title}`);
    const body = encodeURIComponent("Hi, I saw your post on HostelX.");
    const url = `mailto:${post.userEmail}?subject=${subject}&body=${body}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        [{post.type === "need" ? "NEED" : "SELL"}] {post.title}
      </Text>
      <Text style={styles.text}>{post.description}</Text>
      {post.price ? <Text style={styles.text}>Price: {post.price}</Text> : null}
      <Text style={styles.text}>Posted by: {post.userEmail}</Text>

      <Button title="Contact via Email" onPress={handleContact} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  text: { fontSize: 16, marginBottom: 8 },
});
