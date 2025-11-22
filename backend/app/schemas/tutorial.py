"""Tutorial data schemas."""
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class RepoInfo(BaseModel):
    """Repository information."""

    owner: str = Field(..., description="Repository owner")
    name: str = Field(..., description="Repository name")
    stars: int = Field(..., ge=0, description="Number of stars")
    language: Optional[str] = Field(None, description="Primary language")
    github_url: HttpUrl = Field(..., alias="githubUrl", description="GitHub URL")

    class Config:
        populate_by_name = True


class FileNode(BaseModel):
    """File or directory node in repository structure."""

    name: str = Field(..., description="File or directory name")
    path: str = Field(..., description="File or directory path")
    type: str = Field(..., description="Type: 'file' or 'directory'")
    children: Optional[list["FileNode"]] = Field(None, description="Child nodes")
    content: Optional[str] = Field(None, description="File content")
    size: Optional[int] = Field(None, description="File size in bytes")

    class Config:
        populate_by_name = True


# Update forward references for recursive model
FileNode.model_rebuild()


class RepositoryStructure(BaseModel):
    """Repository structure information."""

    root_directories: list[FileNode] = Field(
        default_factory=list, alias="rootDirectories", description="Root directory nodes"
    )
    key_files: list[dict] = Field(
        default_factory=list, alias="keyFiles", description="Key files with descriptions"
    )

    class Config:
        populate_by_name = True


class Step(BaseModel):
    """Learning step."""

    id: str = Field(..., description="Step ID")
    title: str = Field(..., description="Step title")
    description: str = Field(..., description="Step description")
    file_path: str = Field(..., alias="filePath", description="File path")
    line_start: int = Field(..., alias="lineStart", description="Line start")
    line_end: int = Field(..., alias="lineEnd", description="Line end")
    code_snippet: str = Field(..., alias="codeSnippet", description="Code snippet")
    explanation: str = Field(..., description="Detailed explanation")
    tips: list[str] = Field(default_factory=list, description="Tips")
    related_files: list[str] = Field(
        default_factory=list, alias="relatedFiles", description="Related files"
    )
    module_id: Optional[str] = Field(None, alias="moduleId", description="Module ID")

    class Config:
        populate_by_name = True


class Module(BaseModel):
    """Learning module."""

    id: str = Field(..., description="Module ID")
    name: str = Field(..., description="Module name")
    description: str = Field(..., description="Module description")
    dependencies: list[str] = Field(default_factory=list, description="Module dependencies")
    learning_objectives: list[str] = Field(
        default_factory=list, alias="learningObjectives", description="Learning objectives"
    )
    estimated_minutes: int = Field(
        ..., alias="estimatedMinutes", ge=0, description="Estimated time in minutes"
    )
    step_ids: list[str] = Field(
        default_factory=list, alias="stepIds", description="Step IDs"
    )

    class Config:
        populate_by_name = True


class TutorialData(BaseModel):
    """Complete tutorial data."""

    repo: RepoInfo = Field(..., description="Repository information")
    overview: str = Field(..., description="Project overview")
    prerequisites: list[str] = Field(..., description="Prerequisites")
    structure: RepositoryStructure = Field(..., description="Repository structure")
    modules: list[Module] = Field(..., description="Learning modules")
    steps: list[Step] = Field(..., description="Learning steps")


class TutorialRequest(BaseModel):
    """Tutorial generation request."""

    repo_url: HttpUrl = Field(..., alias="repoUrl", description="Repository URL")
    language: str = Field("zh-CN", description="Output language")

    class Config:
        populate_by_name = True


class TutorialResponse(BaseModel):
    """Tutorial API response."""

    ok: bool = Field(True, description="Success status")
    data: TutorialData = Field(..., description="Tutorial data")


class ErrorResponse(BaseModel):
    """Error API response."""

    ok: bool = Field(False, description="Success status")
    error_code: str = Field(..., alias="errorCode", description="Error code")
    message: str = Field(..., description="Error message")
    details: dict = Field(default_factory=dict, description="Error details")

    class Config:
        populate_by_name = True
