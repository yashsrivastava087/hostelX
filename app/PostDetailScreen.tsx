import { View, Text, StyleSheet } from 'react-native';

export default function PostDetailScreen({ route }: any) {
  const { post } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        [{post.type === 'need' ? 'NEED' : 'SELL'}] {post.title}
      </Text>
      <Text style={styles.text}>{post.description}</Text>
      {post.price ? <Text style={styles.text}>Price: {post.price}</Text> : null}
      <Text style={styles.text}>Posted by: {post.userEmail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  text: { fontSize: 16, marginBottom: 8 },
});
