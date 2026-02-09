"use client";

import { MultiFileDiff } from "@pierre/diffs/react";

interface DiffBlockProps {
	oldFile: { name: string; contents: string };
	newFile: { name: string; contents: string };
}

export function DiffBlock({ oldFile, newFile }: DiffBlockProps) {
	return (
		<div className="diff-block">
			<MultiFileDiff
				oldFile={oldFile}
				newFile={newFile}
				options={{
					theme: "github-light",
					themeType: "light",
					diffStyle: "unified",
					diffIndicators: "classic",
					disableLineNumbers: true,
					disableFileHeader: true,
				}}
			/>
		</div>
	);
}
